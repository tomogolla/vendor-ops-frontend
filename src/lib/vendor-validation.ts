import type { CallInput, Vendor, VendorInput, VendorStatus } from '#lib/vendor-store.ts';

/** `contact` covers the lead rule "at least one of email, phone or Instagram". */
export type FieldName = keyof VendorInput | 'contact' | 'interestLevel' | 'callbackAt' | 'outcome';
export type FieldErrors = Partial<Record<FieldName, string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_CHARS = /^[0-9+() .-]+$/;

export const isValidEmail = (value: string) => EMAIL.test(value.trim());

export function isValidPhone(value: string): boolean {
	const trimmed = value.trim();
	return PHONE_CHARS.test(trimmed) && trimmed.replace(/\D/g, '').length >= 7;
}

export function isValidUrl(value: string): boolean {
	try {
		const url = new URL(value.trim());
		return url.protocol === 'http:' || url.protocol === 'https:';
	} catch {
		return false;
	}
}

const blank = (value: string) => value.trim() === '';

export function requiredErrors(input: VendorInput, status: VendorStatus): FieldErrors {
	const errors: FieldErrors = {};
	if (blank(input.brandName)) errors.brandName = 'Brand name is required.';

	if (status === 'lead') {
		if (blank(input.email) && blank(input.phone) && blank(input.instagram)) {
			errors.contact = 'Add at least one way to reach them: email, phone or Instagram.';
		}
		return errors;
	}

	// Contact names, email and phone remain optional throughout the vendor journey.
	// When provided, email and phone are still format-checked by formatErrors().
	if (!input.category) errors.category = 'Category is required.';
	return errors;
}

export function formatErrors(input: VendorInput): FieldErrors {
	const errors: FieldErrors = {};
	if (!blank(input.email) && !isValidEmail(input.email)) errors.email = 'Enter a valid email address.';
	if (!blank(input.phone) && !isValidPhone(input.phone)) {
		errors.phone = 'Enter a valid phone number (at least 7 digits).';
	}
	if (!blank(input.website) && !isValidUrl(input.website)) {
		errors.website = 'Enter a full URL starting with http:// or https://.';
	}
	return errors;
}

const inRange = (value: number, max: number) => Number.isInteger(value) && value >= 0 && value <= max;

export function callErrors(call: CallInput, { requireOutcome = false } = {}): FieldErrors {
	const errors: FieldErrors = {};
	const interest = call.details.interestLevel;
	if (interest !== null && !inRange(interest, 5)) {
		errors.interestLevel = 'Interest level must be a whole number from 0 to 5.';
	}
	if (requireOutcome && !call.outcome) errors.outcome = 'Choose a call outcome.';
	if (call.outcome === 'Callback Requested' && !call.callbackAt) {
		errors.callbackAt = 'Set when to call back.';
	}
	return errors;
}

export function validateVendor(input: VendorInput, status: VendorStatus): FieldErrors {
	return { ...formatErrors(input), ...requiredErrors(input, status) };
}

export function isIncomplete(vendor: Vendor): boolean {
	return Object.keys(requiredErrors(vendor, vendor.status)).length > 0;
}
