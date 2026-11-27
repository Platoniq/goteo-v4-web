<script lang="ts">
    import { actions, isInputError } from "astro:actions";

    import { t } from "../../i18n/store";
    import { zContactForm } from "../../validation/contactValidation";
    import Spinner from "../icons/status/Spinner.svelte";
    import Button from "../library/buttons/Button.svelte";
    import Toast from "../library/feedback/Toast.svelte";
    import TextArea from "../library/inputs/TextArea.svelte";
    import TextInput from "../library/inputs/TextInput.svelte";

    import type z from "zod";

    type FieldName = keyof typeof zContactForm.shape;
    type VisibleField = "name" | "email" | "subject" | "message";

    const visibleFields: VisibleField[] = ["name", "email", "subject", "message"];

    interface ContactForm {
        name: string;
        email: string;
        subject: string;
        message: string;
    }

    let form: ContactForm = $state({ name: "", email: "", subject: "", message: "" });

    const loadedAt = Date.now();

    let isSubmitting = $state(false);
    let validation = $state<Partial<Record<FieldName, z.core.$ZodIssue[]>>>({});
    let formError = $state("");
    let showFormToast = $state(false);
    let showSuccessToast = $state(false);

    function validate(field: VisibleField) {
        const result = zContactForm.shape[field].safeParse(form[field]);

        validation[field] = result.error?.issues;
    }

    function getValidationMessage(field: VisibleField) {
        const issue = validation[field]?.[0];

        return issue ? $t(issue.message) : "";
    }

    function handleIssues(issues: readonly { path?: PropertyKey[] | undefined }[]): boolean {
        let surfaced = false;
        let rejected = false;

        for (const issue of issues) {
            const field = String(issue.path?.[0] ?? "") as FieldName;

            if (visibleFields.includes(field as VisibleField)) {
                surfaced = true;
                validation[field] = [...(validation[field] ?? []), issue as z.core.$ZodIssue];
            } else {
                rejected = true;
            }
        }

        if (rejected) {
            formError = $t("pages.contact.error.spam");
            showFormToast = true;
        }

        return surfaced || rejected;
    }

    const handleSubmit = async (e: SubmitEvent) => {
        e.preventDefault();

        const formElement = e.currentTarget as HTMLFormElement;
        const data = new FormData(formElement);
        data.set("loadedAt", String(loadedAt));

        validation = {};
        showFormToast = false;
        showSuccessToast = false;

        const result = zContactForm.safeParse({
            ...form,
            website: String(data.get("website") ?? ""),
            loadedAt,
        });

        if (!result.success) {
            handleIssues(result.error.issues);
            return;
        }

        isSubmitting = true;
        formError = "";

        const { error } = await actions.contact(data);

        isSubmitting = false;

        if (error) {
            if (isInputError(error)) {
                handleIssues(error.issues);
                return;
            }

            formError = error.message;
            showFormToast = true;
            return;
        }

        form = { name: "", email: "", subject: "", message: "" };
        showSuccessToast = true;
    };
</script>

<form onsubmit={handleSubmit} class="flex w-full flex-col gap-8" id="contact" novalidate>
    <div class="absolute top-0 left-0 ml-[-9999px] h-px w-px overflow-hidden" aria-hidden="true">
        <input type="text" name="website" tabindex="-1" autocomplete="off" />
    </div>

    <div class="grid w-full grid-cols-1 gap-x-4 gap-y-6 md:grid-cols-2">
        <TextInput
            type="text"
            name="name"
            placeholder={$t("pages.contact.form.name")}
            error={getValidationMessage("name")}
            bind:value={form.name}
            onInput={() => validate("name")}
            disabled={isSubmitting}
            required
        />
        <TextInput
            type="email"
            name="email"
            placeholder={$t("pages.contact.form.email")}
            helperText={$t("pages.contact.form.emailHelper")}
            error={getValidationMessage("email")}
            bind:value={form.email}
            onInput={() => validate("email")}
            disabled={isSubmitting}
            required
        />
        <div class="md:col-span-2">
            <TextInput
                type="text"
                name="subject"
                placeholder={$t("pages.contact.form.subject")}
                error={getValidationMessage("subject")}
                class="h-14"
                bind:value={form.subject}
                onInput={() => validate("subject")}
                disabled={isSubmitting}
                required
            />
        </div>
        <div class="md:col-span-2">
            <TextArea
                name="message"
                rows={8}
                placeholder={$t("pages.contact.form.message")}
                helperText={$t("pages.contact.form.messageHelper")}
                error={getValidationMessage("message")}
                bind:value={form.message}
                onInput={() => validate("message")}
                disabled={isSubmitting}
            />
        </div>
    </div>

    <Button type="submit" class="w-fit" disabled={isSubmitting}>
        {#if isSubmitting}
            <Spinner />
        {:else}
            {$t("pages.contact.form.submit")}
        {/if}
    </Button>
</form>

{#if showFormToast}
    <Toast floating variant="error" bind:showToast={showFormToast}>
        {formError}
    </Toast>
{/if}

{#if showSuccessToast}
    <Toast floating variant="success" bind:showToast={showSuccessToast}>
        {$t("pages.contact.success")}
    </Toast>
{/if}
