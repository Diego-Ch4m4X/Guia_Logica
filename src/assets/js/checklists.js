import { announce } from './theme.js?v=__ASSET_VERSION__';

const canonicalStorageKey = 'logic.guide.checks.v1';
const legacyStorageKey = 'logic.t25.checks.v1';

function readState(storage, key) {
	try {
		const parsed = JSON.parse(storage?.getItem(key) || '{}');
		return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
	} catch (error) {
		return {};
	}
}

export function initChecklists() {
	const boxes = [...document.querySelectorAll('.interactive-check[data-check-key]')];
	let storage;
	try {
		storage = globalThis.localStorage;
	} catch (error) {}

	const canonicalState = readState(storage, canonicalStorageKey);
	const legacyState = readState(storage, legacyStorageKey);
	const state = { ...legacyState, ...canonicalState };

	try {
		storage?.setItem(canonicalStorageKey, JSON.stringify(state));
	} catch (error) {}

	boxes.forEach(box => {
		const key = box.dataset.checkKey;
		box.checked = Boolean(state[key]);
		box.addEventListener('change', () => {
			state[key] = box.checked;
			try {
				storage?.setItem(canonicalStorageKey, JSON.stringify(state));
			} catch (error) {}
			announce(box.checked ? 'Item marcado como concluído.' : 'Item desmarcado.');
		});
	});
}
