import { ActionError, defineAction } from "astro:actions";

import { zContactForm } from "../validation/contactValidation.ts";

const MIN_SUBMIT_MS = 3000;

export const contact = defineAction({
    accept: "form",
    input: zContactForm,
    handler: async (input, context) => {
        const { t } = context.locals;

        const elapsed = Date.now() - input.loadedAt;

        if (elapsed >= 0 && elapsed < MIN_SUBMIT_MS) {
            throw new ActionError({
                code: "BAD_REQUEST",
                message: t("pages.contact.error.spam"),
            });
        }

        // TODO: deliver the message through the API once the contact endpoint exists
        return { success: true };
    },
});
