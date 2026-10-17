#!/usr/bin/env bash
set -euo pipefail

if [[ ${EUID} -ne 0 ]]; then
    echo "This script must run as root." >&2
    exit 1
fi

ARTIFACT=${1:?Usage: deploy-frontend.sh ARTIFACT RELEASE_ID}
RELEASE_ID=${2:?Usage: deploy-frontend.sh ARTIFACT RELEASE_ID}
RELEASE_ROOT=/var/www/vendor-ops/releases
RELEASE_DIR=${RELEASE_ROOT}/frontend-${RELEASE_ID}
CURRENT_LINK=/var/www/vendor-ops/current
STAGING_DIR=$(mktemp -d)
trap 'rm -rf "${STAGING_DIR}"' EXIT

[[ -f ${ARTIFACT} ]] || { echo "Artifact not found: ${ARTIFACT}" >&2; exit 1; }
install -d -m 0755 "${RELEASE_DIR}"
tar -xzf "${ARTIFACT}" -C "${STAGING_DIR}"
[[ -f ${STAGING_DIR}/build/index.html ]] || { echo "Frontend artifact has no build/index.html" >&2; exit 1; }

# A successful Vite build is not enough: index.html must reference at least one
# generated stylesheet, and every referenced stylesheet must be in the release.
mapfile -t CSS_ASSETS < <(
    grep -oE 'href="/_app/immutable/assets/[^"]+\.css"' "${STAGING_DIR}/build/index.html" \
        | sed -E 's/^href="\/(.*)"$/\1/' \
        | sort -u
)
[[ ${#CSS_ASSETS[@]} -gt 0 ]] || { echo "Frontend index.html references no generated CSS." >&2; exit 1; }
for asset in "${CSS_ASSETS[@]}"; do
    [[ -s ${STAGING_DIR}/build/${asset} ]] || {
        echo "Frontend CSS asset is missing or empty: ${asset}" >&2
        exit 1
    }
done

cp -a "${STAGING_DIR}/build/." "${RELEASE_DIR}/"
chown -R root:www-data "${RELEASE_DIR}"
find "${RELEASE_DIR}" -type d -exec chmod 0755 {} +
find "${RELEASE_DIR}" -type f -exec chmod 0644 {} +

PREVIOUS_RELEASE=$(readlink -f "${CURRENT_LINK}" 2>/dev/null || true)
nginx -t
ln -sfn "${RELEASE_DIR}" "${CURRENT_LINK}"
systemctl reload nginx

# Check the actual HTTPS virtual host and its CSS, not merely the HTTP-to-HTTPS
# redirect. If verification fails, restore the previous atomic release.
LIVE_INDEX=${STAGING_DIR}/live-index.html
if ! curl --fail --silent --show-error \
    --resolve ops.thegoodflea.com:443:127.0.0.1 \
    -H 'Cache-Control: no-cache' \
    https://ops.thegoodflea.com/ -o "${LIVE_INDEX}"; then
    [[ -n ${PREVIOUS_RELEASE} ]] && ln -sfn "${PREVIOUS_RELEASE}" "${CURRENT_LINK}" && systemctl reload nginx
    echo "Frontend HTTPS health check failed; the previous release was restored." >&2
    exit 1
fi

mapfile -t LIVE_CSS_ASSETS < <(
    grep -oE 'href="/_app/immutable/assets/[^"]+\.css"' "${LIVE_INDEX}" \
        | sed -E 's/^href="(.*)"$/\1/' \
        | sort -u
)
if [[ ${#LIVE_CSS_ASSETS[@]} -eq 0 ]]; then
    [[ -n ${PREVIOUS_RELEASE} ]] && ln -sfn "${PREVIOUS_RELEASE}" "${CURRENT_LINK}" && systemctl reload nginx
    echo "Live frontend references no CSS; the previous release was restored." >&2
    exit 1
fi
for asset in "${LIVE_CSS_ASSETS[@]}"; do
    headers=${STAGING_DIR}/css-headers
    if ! curl --fail --silent --show-error \
        --resolve ops.thegoodflea.com:443:127.0.0.1 \
        -D "${headers}" -o /dev/null "https://ops.thegoodflea.com${asset}" \
        || ! grep -qiE '^content-type:[[:space:]]*text/css([[:space:]]*;|[[:space:]]*$)' "${headers}"; then
        [[ -n ${PREVIOUS_RELEASE} ]] && ln -sfn "${PREVIOUS_RELEASE}" "${CURRENT_LINK}" && systemctl reload nginx
        echo "Live CSS verification failed for ${asset}; the previous release was restored." >&2
        exit 1
    fi
done

find "${RELEASE_ROOT}" -mindepth 1 -maxdepth 1 -type d -name 'frontend-*' -printf '%T@ %p\n' | sort -nr | tail -n +6 | cut -d' ' -f2- | xargs -r rm -rf
rm -f "${ARTIFACT}"
echo "Frontend release ${RELEASE_ID} deployed."
