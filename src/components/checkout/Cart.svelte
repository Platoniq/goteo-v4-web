<script lang="ts">
    import CheckoutCartItem from "./CheckoutCartItem.svelte";
    import Tipjar from "./Tipjar.svelte";
    import { cart, cartByRecipient, checkoutHydrated } from "../../stores/checkoutsStore";
    import * as tipping from "../../utils/tipping";
    import Loader from "../library/feedback/Loader.svelte";
    import Title from "../library/typography/Title.svelte";

    function increment(item: { key: string; quantity: number }) {
        cart.updateQuantity(item.key, item.quantity + 1);
    }

    function decrement(item: { key: string; quantity: number }) {
        if (item.quantity > 1) {
            cart.updateQuantity(item.key, item.quantity - 1);
        }
    }

    function remove(item: { key: string }) {
        cart.removeItem(item.key);
    }

    const mainItems = $derived(
        Object.entries($cartByRecipient).filter(
            ([recipient]) => !tipping.isEnabled || recipient !== tipping.tipjarIri,
        ),
    );
    const tipItems = $derived($cartByRecipient[tipping.tipjarIri] ?? []);
    const standaloneFoundationDonation = $derived(tipping.isEnabled && mainItems.length === 0);
</script>

{#if !$checkoutHydrated}
    <Loader />
{:else}
    <div class="flex flex-col gap-10">
        {#each mainItems as [_target, items]}
            <div class="flex flex-col gap-6">
                <Title level={2} variant="subsection">
                    {items[0].recipientDisplayName}
                </Title>

                {#each items as item (item.key)}
                    <CheckoutCartItem
                        {item}
                        onIncrement={() => increment(item)}
                        onDecrement={() => decrement(item)}
                        onRemove={() => remove(item)}
                    />
                {/each}
            </div>
        {/each}
    </div>

    {#if tipping.isEnabled}
        {#if standaloneFoundationDonation}
            <Tipjar standalone={true} />
        {:else}
            <Tipjar />
        {/if}
    {/if}
{/if}
