<script lang="ts">
    import { t } from "../../i18n/store";
    import { apiTipjarsIdGet, type MoneyInput } from "../../openapi/client";
    import { cart, checkoutReady } from "../../stores/checkoutsStore";
    import { DEFAULT_CURRENCY } from "../../utils/currencies";
    import * as tipping from "../../utils/tipping";
    import Spinner from "../icons/status/Spinner.svelte";
    import Button from "../library/buttons/Button.svelte";
    import CurrencyInput from "../library/inputs/CurrencyInput.svelte";
    import Title from "../library/typography/Title.svelte";

    let money = $state<MoneyInput>({
        amount: Number(tipping.defaultAmount),
        currency: DEFAULT_CURRENCY,
    });
    let isSubmitting = $state(false);
    let amountError = $state("");

    async function donate() {
        if (money.amount <= 0) {
            amountError = $t("pages.checkout.tipjar.error.invalidAmount");
            return;
        }

        amountError = "";
        isSubmitting = true;

        try {
            const { data: tipjar } = await apiTipjarsIdGet({ path: { id: tipping.tipjarId } });
            if (!tipjar?.accounting) {
                throw new Error("Missing tipjar accounting");
            }

            const name =
                $t("common.footer.navigation.aboutGoteo.platoniqFoundation") ||
                tipjar.name ||
                $t("pages.checkout.tipjar.standaloneTitle");

            cart.addItem({
                kind: "tip",
                type: "single",
                quantity: 1,
                title: name,
                money,
                recipient: tipping.tipjarIri,
                recipientDisplayName: name,
                target: tipjar.accounting,
            });

            await checkoutReady();
            window.location.href = "/checkout";
        } finally {
            isSubmitting = false;
        }
    }
</script>

{#if !tipping.isEnabled}
    <p class="text-content">{$t("pages.checkout.tipjar.standaloneDescription")}</p>
{:else}
    <div class="flex w-full max-w-md flex-col gap-6">
        <div class="flex flex-col gap-2">
            <Title level={1} variant="headline" color="secondary">
                {$t("pages.checkout.tipjar.standaloneTitle")}
            </Title>
            <p class="text-content">{$t("pages.checkout.tipjar.standaloneDescription")}</p>
        </div>

        <div class="flex flex-col gap-4">
            <CurrencyInput
                amount={money.amount}
                currency={money.currency}
                placeholder={$t("pages.checkout.tipjar.input")}
                error={amountError}
                onInput={(newMoney) => {
                    money = newMoney;
                    if (newMoney.amount > 0) amountError = "";
                }}
            />

            <Button kind="primary" class="w-fit" disabled={isSubmitting} onclick={donate}>
                {#if isSubmitting}
                    <Spinner />
                {:else}
                    {$t("common.donate")}
                {/if}
            </Button>
        </div>
    </div>
{/if}
