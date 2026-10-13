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
cp -a "${STAGING_DIR}/build/." "${RELEASE_DIR}/"
chown -R root:www-data "${RELEASE_DIR}"
find "${RELEASE_DIR}" -type d -exec chmod 0755 {} +
find "${RELEASE_DIR}" -type f -exec chmod 0644 {} +

ln -sfn "${RELEASE_DIR}" "${CURRENT_LINK}"
nginx -t
systemctl reload nginx
curl --fail --silent --show-error -H 'Host: ops.thegoodflea.com' http://127.0.0.1/ >/dev/null

find "${RELEASE_ROOT}" -mindepth 1 -maxdepth 1 -type d -name 'frontend-*' -printf '%T@ %p\n' | sort -nr | tail -n +6 | cut -d' ' -f2- | xargs -r rm -rf
rm -f "${ARTIFACT}"
echo "Frontend release ${RELEASE_ID} deployed."
