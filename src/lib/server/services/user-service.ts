import { hash } from 'bcryptjs';
import { userRepository } from '$lib/server/repositories/user-repository';
import { formTrimmed } from '$lib/server/validation/form';
import type { ServiceResult } from '$lib/server/services/result';

export type { ServiceResult };

const MIN_PASSWORD_LENGTH = 8;

export const userService = {
	async registerFromForm(formData: FormData): Promise<ServiceResult<void>> {
		const name = formTrimmed(formData, 'name');
		const email = formTrimmed(formData, 'email')?.toLowerCase();
		const password = formData.get('password')?.toString();

		if (!name || !email || !password) {
			return { ok: false, message: 'All fields are required.' };
		}
		if (password.length < MIN_PASSWORD_LENGTH) {
			return { ok: false, message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.` };
		}
		if (await userRepository.emailExists(email)) {
			return { ok: false, message: 'An account with this email already exists.' };
		}

		const passwordHash = await hash(password, 12);
		await userRepository.create({ name, email, passwordHash });
		return { ok: true, data: undefined };
	}
};