export function formString(data: FormData, key: string): string | undefined {
	return data.get(key)?.toString();
}

export function formTrimmed(data: FormData, key: string): string | undefined {
	return formString(data, key)?.trim();
}