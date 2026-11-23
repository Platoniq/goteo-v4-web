<script lang="ts">
    import { onMount } from "svelte";

    import { t } from "../../i18n/store";
    import { apiTipjarsIdGet, type MoneyInput } from "../../openapi/client";
    import { cart, cartByRecipient, type CheckoutItem } from "../../stores/checkoutsStore";
    import { DEFAULT_CURRENCY } from "../../utils/currencies";
    import * as tipping from "../../utils/tipping";
    import Checkbox from "../library/inputs/Checkbox.svelte";
    import CurrencyInput from "../library/inputs/CurrencyInput.svelte";
    import Title from "../library/typography/Title.svelte";

    let { standalone = false }: { standalone?: boolean } = $props();

    let money = $state<MoneyInput>({
        amount: Number(tipping.defaultAmount),
        currency: DEFAULT_CURRENCY,
    });

    let isChecked = $state(tipping.defaultChecked);

    const amountError = $derived(
        money.amount <= 0 ? $t("pages.checkout.tipjar.error.invalidAmount") : "",
    );

    onMount(() => {
        const existing = $cartByRecipient[tipping.tipjarIri]?.[0];
        if (existing) {
            money = existing.money;
            isChecked = true;
        }

        if (standalone) {
            isChecked = true;
        }

        toggleTip();
    });

    async function getTip(): Promise<Omit<CheckoutItem, "key">> {
        const existing = $cartByRecipient[tipping.tipjarIri]?.[0];
        const { data: tipjar } = await apiTipjarsIdGet({ path: { id: tipping.tipjarId } });
        const name =
            $t("common.footer.navigation.aboutGoteo.platoniqFoundation") ||
            tipjar?.name ||
            existing?.recipientDisplayName ||
            $t("pages.checkout.tipjar.standaloneTitle");

        if (existing) {
            return {
                ...existing,
                title: name,
                recipientDisplayName: name,
                target: tipjar?.accounting ?? existing.target,
            };
        }

        return {
            kind: "tip",
            type: "single",
            quantity: 1,
            title: name,
            money: { amount: Number(tipping.defaultAmount), currency: DEFAULT_CURRENCY },
            recipient: tipping.tipjarIri,
            recipientDisplayName: name,
            target: tipjar?.accounting!,
        };
    }

    async function setTip(newMoney: MoneyInput) {
        const tip = await getTip();

        cart.addItem({
            ...tip,
            money: newMoney,
        });
    }

    function handleAmountChange(newMoney: MoneyInput) {
        money = newMoney;

        if (newMoney.amount <= 0) {
            return;
        }

        if (isChecked) {
            setTip(newMoney);
        }
    }

    function toggleTip() {
        if (!isChecked) {
            const tip = $cartByRecipient[tipping.tipjarIri]?.[0];
            if (!tip) {
                return;
            }

            cart.removeItem(tip.key);
        } else {
            setTip(money);
        }
    }
</script>

<div class="flex w-auto flex-col gap-4">
    <div class="flex flex-col gap-2">
        <Title level={2} variant="subsection">
            {standalone
                ? $t("pages.checkout.tipjar.standaloneTitle")
                : $t("pages.checkout.tipjar.community")}
        </Title>

        {#if standalone}
            <p class="text-content text-sm">{$t("pages.checkout.tipjar.standaloneDescription")}</p>
        {/if}

        <CurrencyInput
            amount={money.amount}
            currency={money.currency}
            placeholder={$t("pages.checkout.tipjar.input")}
            disabled={!isChecked}
            error={amountError}
            onInput={handleAmountChange}
        />
    </div>

    {#if !standalone}
        <div>
            <Checkbox
                id="donation-checkbox"
                bind:checked={isChecked}
                onchange={toggleTip}
                class="gap-2"
            >
                <span class="text-secondary">{$t("pages.checkout.tipjar.checkboxLabel")}</span>
            </Checkbox>
        </div>
    {/if}
</div>
