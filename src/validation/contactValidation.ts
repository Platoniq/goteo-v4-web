import { z } from "zod";

const zRequiredField = () =>
    z.string().trim().min(1, {
        error: "pages.contact.form.validation.required",
    });

export const zContactForm = z.object({
    name: zRequiredField().max(100, {
        error: "pages.contact.form.validation.tooLong",
    }),
    email: z.email({
        error: "pages.contact.form.validation.emailInvalid",
    }),
    subject: zRequiredField().max(150, {
        error: "pages.contact.form.validation.tooLong",
    }),
    message: zRequiredField()
        .min(10, {
            error: "pages.contact.form.validation.messageTooShort",
        })
        .max(5000, {
            error: "pages.contact.form.validation.tooLong",
        }),
    website: z.union([z.literal(""), z.null()], {
        error: "pages.contact.error.spam",
    }),
    loadedAt: z.number().int().positive(),
});
