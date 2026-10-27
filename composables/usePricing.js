import { CRUSTS, CHEESES, SAUCES, SIZES, TOPPINGS, findOption } from '~/data/pizzaOptions'
import { formatLKR, pizzaPriceBreakdown, pizzaUnitPrice } from '~/utils/pricing'

/** Pricing & labelling helpers for templates. */
export function usePricing() {
  const describeOptions = (options) => {
    if (!options) return ''
    return [
      findOption(SIZES, options.size)?.name,
      findOption(CRUSTS, options.crust)?.name,
      findOption(SAUCES, options.sauce)?.name,
      findOption(CHEESES, options.cheese)?.name,
    ]
      .filter(Boolean)
      .join(' · ')
  }

  const toppingNames = (ids = []) => ids.map((id) => findOption(TOPPINGS, id)?.name).filter(Boolean)

  return { formatLKR, pizzaPriceBreakdown, pizzaUnitPrice, describeOptions, toppingNames }
}
