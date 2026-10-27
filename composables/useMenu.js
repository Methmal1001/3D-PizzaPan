import { CATEGORIES, findCategory } from '~/data/categories'
import { PRODUCTS } from '~/data/products'

export const SORT_OPTIONS = [
  { id: 'featured', label: 'Featured first' },
  { id: 'price-asc', label: 'Price: low to high' },
  { id: 'price-desc', label: 'Price: high to low' },
  { id: 'rating', label: 'Top rated' },
  { id: 'prep', label: 'Fastest to prepare' },
  { id: 'name', label: 'Name A–Z' },
]

/**
 * Filtering, searching and sorting of the local menu data.
 * The selected category is synced with the `?category=` query so hotspots & links can deep-link.
 */
export function useMenu() {
  const route = useRoute()
  const router = useRouter()

  const search = ref(typeof route.query.q === 'string' ? route.query.q : '')
  const sort = ref('featured')
  const vegOnly = ref(false)
  const spicyOnly = ref(false)

  const category = computed({
    get: () => {
      const q = route.query.category
      return typeof q === 'string' && CATEGORIES.some((c) => c.id === q) ? q : 'all'
    },
    set: (id) => {
      router.replace({ query: { ...route.query, category: id === 'all' ? undefined : id } })
    },
  })

  const activeCategory = computed(() => findCategory(category.value))

  const filtered = computed(() => {
    const term = search.value.trim().toLowerCase()
    let list = PRODUCTS.filter((p) => category.value === 'all' || p.categories.includes(category.value))
    if (term) {
      list = list.filter((p) =>
        [p.name, p.description, ...(p.tags || []), p.category].join(' ').toLowerCase().includes(term),
      )
    }
    if (vegOnly.value) list = list.filter((p) => p.vegetarian)
    if (spicyOnly.value) list = list.filter((p) => p.spicy > 0)

    const sorted = [...list]
    switch (sort.value) {
      case 'price-asc':
        sorted.sort((a, b) => a.price - b.price)
        break
      case 'price-desc':
        sorted.sort((a, b) => b.price - a.price)
        break
      case 'rating':
        sorted.sort((a, b) => b.rating - a.rating)
        break
      case 'prep':
        sorted.sort((a, b) => a.prepTime - b.prepTime)
        break
      case 'name':
        sorted.sort((a, b) => a.name.localeCompare(b.name))
        break
      default:
        sorted.sort((a, b) => Number(b.featured) - Number(a.featured))
    }
    return sorted
  })

  const featured = computed(() => PRODUCTS.filter((p) => p.featured && p.type !== 'builder').slice(0, 8))

  const countFor = (id) => (id === 'all' ? PRODUCTS.length : PRODUCTS.filter((p) => p.categories.includes(id)).length)

  const resetFilters = () => {
    search.value = ''
    vegOnly.value = false
    spicyOnly.value = false
    sort.value = 'featured'
  }

  return {
    categories: CATEGORIES,
    category,
    activeCategory,
    search,
    sort,
    vegOnly,
    spicyOnly,
    filtered,
    featured,
    countFor,
    resetFilters,
    sortOptions: SORT_OPTIONS,
  }
}
