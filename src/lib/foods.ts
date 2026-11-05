import type { Diet } from "./types";

/** Which diet levels a meal needs. vegan ⊂ veg ⊂ egg ⊂ fish ⊂ meat */
export type DietTag = "vegan" | "veg" | "egg" | "fish" | "meat";

const ALLOWED: Record<Diet, DietTag[]> = {
  vegan: ["vegan"],
  vegetarian: ["vegan", "veg"],
  eggetarian: ["vegan", "veg", "egg"],
  pescatarian: ["vegan", "veg", "egg", "fish"],
  non_veg: ["vegan", "veg", "egg", "fish", "meat"],
};

export interface MealTemplate {
  name: string;
  slot: "breakfast" | "lunch" | "dinner" | "snack";
  tag: DietTag;
  items: string[]; // base portion
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  keywords: string[]; // for dislikes filtering
}

export const MEALS: MealTemplate[] = [
  // ---------- Breakfast ----------
  { name: "Greek yogurt berry bowl", slot: "breakfast", tag: "veg", items: ["250g Greek yogurt", "100g mixed berries", "30g oats", "10g chia seeds"], kcal: 420, protein: 30, carbs: 48, fat: 11, keywords: ["yogurt", "dairy", "berries", "oats"] },
  { name: "Avocado toast & cottage cheese", slot: "breakfast", tag: "veg", items: ["2 slices sourdough", "½ avocado", "120g cottage cheese", "cherry tomatoes"], kcal: 480, protein: 24, carbs: 46, fat: 21, keywords: ["avocado", "bread", "dairy"] },
  { name: "Paneer bhurji wrap", slot: "breakfast", tag: "veg", items: ["100g paneer", "1 wholemeal wrap", "onion, tomato, capsicum", "1 tsp oil"], kcal: 470, protein: 26, carbs: 32, fat: 25, keywords: ["paneer", "dairy", "wrap"] },
  { name: "Moong dal chilla with curd", slot: "breakfast", tag: "veg", items: ["2 moong dal chillas (80g dal)", "100g low-fat curd", "mint chutney"], kcal: 400, protein: 26, carbs: 50, fat: 8, keywords: ["dal", "curd", "dairy"] },
  { name: "Tofu scramble on toast", slot: "breakfast", tag: "vegan", items: ["200g firm tofu", "2 slices wholegrain toast", "spinach", "turmeric & pepper"], kcal: 440, protein: 30, carbs: 38, fat: 18, keywords: ["tofu", "soy", "bread"] },
  { name: "Protein oats (plant)", slot: "breakfast", tag: "vegan", items: ["60g oats", "300ml soy milk", "1 banana", "15g peanut butter"], kcal: 520, protein: 24, carbs: 74, fat: 15, keywords: ["oats", "banana", "peanut", "soy"] },
  { name: "Masala omelette & toast", slot: "breakfast", tag: "egg", items: ["3 eggs", "onion, tomato, chilli", "2 slices wholegrain toast"], kcal: 450, protein: 28, carbs: 30, fat: 23, keywords: ["egg", "bread"] },
  { name: "Eggs, spinach & sweet potato hash", slot: "breakfast", tag: "egg", items: ["2 eggs + 100ml egg whites", "150g sweet potato", "spinach"], kcal: 390, protein: 28, carbs: 34, fat: 14, keywords: ["egg", "sweet potato"] },

  // ---------- Lunch ----------
  { name: "Rajma rice bowl", slot: "lunch", tag: "vegan", items: ["200g rajma curry", "150g cooked basmati", "salad & lemon"], kcal: 560, protein: 22, carbs: 92, fat: 10, keywords: ["rajma", "beans", "rice"] },
  { name: "Paneer tikka quinoa bowl", slot: "lunch", tag: "veg", items: ["120g paneer tikka", "150g cooked quinoa", "cucumber, onion, mint raita"], kcal: 610, protein: 36, carbs: 50, fat: 28, keywords: ["paneer", "dairy", "quinoa"] },
  { name: "Dal, roti & sabzi thali", slot: "lunch", tag: "veg", items: ["1 bowl dal (60g dry)", "2 rotis", "1 bowl seasonal sabzi", "100g curd"], kcal: 580, protein: 26, carbs: 82, fat: 15, keywords: ["dal", "roti", "curd", "dairy"] },
  { name: "Chickpea & feta salad", slot: "lunch", tag: "veg", items: ["200g chickpeas", "40g feta", "mixed leaves, tomato, cucumber", "olive oil & lemon"], kcal: 540, protein: 24, carbs: 54, fat: 24, keywords: ["chickpea", "feta", "dairy"] },
  { name: "Teriyaki tofu rice bowl", slot: "lunch", tag: "vegan", items: ["200g firm tofu", "150g cooked rice", "edamame, broccoli, carrot"], kcal: 590, protein: 34, carbs: 70, fat: 18, keywords: ["tofu", "soy", "rice"] },
  { name: "Egg fried rice & greens", slot: "lunch", tag: "egg", items: ["3 eggs", "150g cooked rice", "mixed vegetables", "soy & sesame"], kcal: 560, protein: 27, carbs: 62, fat: 21, keywords: ["egg", "rice"] },
  { name: "Grilled salmon, potato & salad", slot: "lunch", tag: "fish", items: ["150g salmon", "200g baby potatoes", "green salad"], kcal: 600, protein: 37, carbs: 40, fat: 30, keywords: ["salmon", "fish", "potato"] },
  { name: "Chicken burrito bowl", slot: "lunch", tag: "meat", items: ["160g chicken breast", "120g rice", "black beans, salsa, lettuce", "30g cheese"], kcal: 640, protein: 50, carbs: 64, fat: 18, keywords: ["chicken", "rice", "beans", "cheese"] },
  { name: "Lean beef & veg stir-fry", slot: "lunch", tag: "meat", items: ["150g lean beef strips", "150g rice noodles (cooked)", "stir-fry vegetables"], kcal: 590, protein: 42, carbs: 58, fat: 18, keywords: ["beef", "noodles"] },

  // ---------- Dinner ----------
  { name: "Palak paneer & jeera rice", slot: "dinner", tag: "veg", items: ["120g paneer in spinach gravy", "120g jeera rice"], kcal: 590, protein: 30, carbs: 52, fat: 28, keywords: ["paneer", "spinach", "rice", "dairy"] },
  { name: "Soya chunk curry & roti", slot: "dinner", tag: "vegan", items: ["60g soya chunks (dry)", "tomato-onion gravy", "2 rotis"], kcal: 520, protein: 38, carbs: 62, fat: 12, keywords: ["soya", "soy", "roti"] },
  { name: "Chana masala & brown rice", slot: "dinner", tag: "vegan", items: ["220g chana masala", "120g brown rice", "onion salad"], kcal: 540, protein: 21, carbs: 84, fat: 12, keywords: ["chickpea", "chana", "rice"] },
  { name: "Lentil bolognese pasta", slot: "dinner", tag: "vegan", items: ["80g wholemeal pasta (dry)", "red lentil & tomato sauce", "side salad"], kcal: 560, protein: 28, carbs: 88, fat: 9, keywords: ["lentil", "pasta"] },
  { name: "Tofu & veg Thai curry", slot: "dinner", tag: "vegan", items: ["180g tofu", "light coconut curry", "120g jasmine rice"], kcal: 610, protein: 30, carbs: 64, fat: 25, keywords: ["tofu", "coconut", "rice"] },
  { name: "Shakshuka & pita", slot: "dinner", tag: "egg", items: ["3 eggs in tomato-pepper sauce", "1 wholemeal pita", "30g feta"], kcal: 520, protein: 28, carbs: 40, fat: 26, keywords: ["egg", "feta", "bread"] },
  { name: "Garlic prawns & greens", slot: "dinner", tag: "fish", items: ["180g prawns", "120g cooked rice", "bok choy & broccoli"], kcal: 470, protein: 40, carbs: 48, fat: 11, keywords: ["prawn", "seafood", "rice"] },
  { name: "Tandoori chicken & salad", slot: "dinner", tag: "meat", items: ["180g tandoori chicken", "1 roti", "kachumber salad", "mint raita"], kcal: 520, protein: 52, carbs: 30, fat: 19, keywords: ["chicken", "roti", "dairy"] },
  { name: "Steak, sweet potato & greens", slot: "dinner", tag: "meat", items: ["170g lean steak", "200g sweet potato", "green beans"], kcal: 600, protein: 46, carbs: 44, fat: 24, keywords: ["beef", "steak", "sweet potato"] },

  // ---------- Non-veg & egg additions ----------
  // breakfast
  { name: "Chicken sausage & egg muffin", slot: "breakfast", tag: "meat", items: ["1 wholemeal English muffin", "2 chicken chipolatas", "1 egg", "spinach"], kcal: 430, protein: 33, carbs: 30, fat: 19, keywords: ["chicken", "sausage", "egg", "bread"] },
  { name: "Smoked salmon & scrambled eggs", slot: "breakfast", tag: "fish", items: ["2 eggs + 60ml egg whites", "60g smoked salmon", "1 slice rye toast", "chives"], kcal: 410, protein: 36, carbs: 17, fat: 21, keywords: ["salmon", "fish", "egg", "bread"] },
  { name: "Turkey & avocado breakfast wrap", slot: "breakfast", tag: "meat", items: ["1 wholemeal wrap", "80g sliced turkey", "2 egg whites", "¼ avocado", "salsa"], kcal: 400, protein: 34, carbs: 31, fat: 15, keywords: ["turkey", "avocado", "wrap"] },
  { name: "Egg bhurji & paratha (light)", slot: "breakfast", tag: "egg", items: ["3 eggs scrambled with onion, tomato, chilli", "1 small wholemeal paratha"], kcal: 450, protein: 24, carbs: 30, fat: 25, keywords: ["egg", "paratha"] },
  { name: "Chicken keema on toast", slot: "breakfast", tag: "meat", items: ["120g lean chicken mince keema", "2 slices sourdough", "coriander"], kcal: 440, protein: 36, carbs: 38, fat: 14, keywords: ["chicken", "mince", "bread"] },

  // lunch
  { name: "Chicken tikka rice bowl", slot: "lunch", tag: "meat", items: ["160g chicken tikka", "150g basmati rice", "kachumber salad", "mint yoghurt"], kcal: 620, protein: 50, carbs: 66, fat: 14, keywords: ["chicken", "rice", "yoghurt", "dairy"] },
  { name: "Greek chicken souvlaki plate", slot: "lunch", tag: "meat", items: ["160g grilled chicken", "1 pita", "tzatziki", "tomato, cucumber, red onion"], kcal: 580, protein: 48, carbs: 50, fat: 18, keywords: ["chicken", "pita", "bread", "dairy"] },
  { name: "Tuna poke bowl", slot: "lunch", tag: "fish", items: ["130g sashimi tuna (or tinned)", "130g sushi rice", "edamame, cucumber, avocado", "soy & sesame"], kcal: 560, protein: 40, carbs: 62, fat: 15, keywords: ["tuna", "fish", "rice", "soy"] },
  { name: "Lamb kofta & tabbouleh", slot: "lunch", tag: "meat", items: ["150g lean lamb kofta", "bulgur tabbouleh", "hummus"], kcal: 640, protein: 40, carbs: 48, fat: 30, keywords: ["lamb", "bulgur", "hummus"] },
  { name: "Chicken caesar wrap (light)", slot: "lunch", tag: "meat", items: ["150g grilled chicken", "1 wholemeal wrap", "cos lettuce", "light caesar, parmesan"], kcal: 540, protein: 47, carbs: 38, fat: 20, keywords: ["chicken", "wrap", "cheese", "dairy"] },
  { name: "Prawn & mango rice paper rolls", slot: "lunch", tag: "fish", items: ["150g prawns", "4 rice paper rolls with vermicelli, mango, herbs", "peanut dipping sauce"], kcal: 500, protein: 34, carbs: 64, fat: 11, keywords: ["prawn", "seafood", "peanut", "noodles"] },
  { name: "Turkey mince taco bowl", slot: "lunch", tag: "meat", items: ["150g lean turkey mince", "120g rice", "black beans, corn, salsa", "30g cheese"], kcal: 610, protein: 45, carbs: 60, fat: 19, keywords: ["turkey", "mince", "rice", "beans", "cheese"] },
  { name: "Egg curry & rice", slot: "lunch", tag: "egg", items: ["3 boiled eggs in tomato-onion curry", "130g basmati rice"], kcal: 560, protein: 26, carbs: 58, fat: 24, keywords: ["egg", "curry", "rice"] },

  // dinner
  { name: "Butter chicken (lighter) & rice", slot: "dinner", tag: "meat", items: ["170g chicken in light butter-tomato gravy", "130g basmati rice", "salad"], kcal: 640, protein: 48, carbs: 58, fat: 22, keywords: ["chicken", "rice", "dairy"] },
  { name: "Baked barramundi & veg", slot: "dinner", tag: "fish", items: ["180g barramundi", "200g roast potatoes & pumpkin", "greens", "lemon"], kcal: 520, protein: 42, carbs: 48, fat: 15, keywords: ["barramundi", "fish", "potato"] },
  { name: "Chicken stir-fry & noodles", slot: "dinner", tag: "meat", items: ["170g chicken breast", "150g cooked egg noodles", "stir-fry vegetables", "soy, ginger, garlic"], kcal: 590, protein: 48, carbs: 60, fat: 15, keywords: ["chicken", "noodles", "soy"] },
  { name: "Lamb rogan josh & roti", slot: "dinner", tag: "meat", items: ["150g lean lamb rogan josh", "2 rotis", "cucumber raita"], kcal: 620, protein: 40, carbs: 52, fat: 26, keywords: ["lamb", "roti", "dairy"] },
  { name: "Salmon teriyaki & greens", slot: "dinner", tag: "fish", items: ["160g salmon", "teriyaki glaze", "120g jasmine rice", "broccolini"], kcal: 630, protein: 40, carbs: 55, fat: 26, keywords: ["salmon", "fish", "rice", "soy"] },
  { name: "Beef & vegetable chilli", slot: "dinner", tag: "meat", items: ["150g lean beef mince", "kidney beans, tomato, capsicum", "100g rice or 1 wrap"], kcal: 600, protein: 45, carbs: 55, fat: 20, keywords: ["beef", "mince", "beans", "rice"] },
  { name: "Grilled chicken, sweet potato & slaw", slot: "dinner", tag: "meat", items: ["180g chicken thigh (skinless)", "200g sweet potato wedges", "slaw with yoghurt dressing"], kcal: 580, protein: 46, carbs: 48, fat: 20, keywords: ["chicken", "sweet potato", "dairy"] },
  { name: "Fish curry (Goan style) & rice", slot: "dinner", tag: "fish", items: ["170g white fish in light coconut curry", "130g rice"], kcal: 560, protein: 38, carbs: 56, fat: 19, keywords: ["fish", "coconut", "rice"] },
  { name: "Egg fried cauliflower rice & chicken", slot: "dinner", tag: "meat", items: ["130g chicken breast", "2 eggs", "300g cauliflower rice with veg", "soy"], kcal: 470, protein: 50, carbs: 18, fat: 21, keywords: ["chicken", "egg", "cauliflower", "soy"] },

  // snacks
  { name: "Chicken & hummus snack box", slot: "snack", tag: "meat", items: ["80g shredded chicken", "40g hummus", "carrot & cucumber sticks"], kcal: 230, protein: 24, carbs: 10, fat: 10, keywords: ["chicken", "hummus"] },
  { name: "Beef jerky & apple", slot: "snack", tag: "meat", items: ["30g lean beef jerky", "1 apple"], kcal: 190, protein: 15, carbs: 28, fat: 2, keywords: ["beef", "jerky", "apple"] },
  { name: "Tuna & crackers", slot: "snack", tag: "fish", items: ["95g tuna in springwater", "6 wholegrain crackers"], kcal: 210, protein: 23, carbs: 18, fat: 5, keywords: ["tuna", "fish", "crackers"] },
  { name: "Egg muffins (2)", slot: "snack", tag: "egg", items: ["2 baked egg & veg muffins"], kcal: 180, protein: 14, carbs: 4, fat: 12, keywords: ["egg"] },

  // ---------- Snacks ----------
  { name: "Roasted chana & fruit", slot: "snack", tag: "vegan", items: ["40g roasted chana", "1 apple"], kcal: 230, protein: 9, carbs: 38, fat: 4, keywords: ["chana", "chickpea", "apple"] },
  { name: "Protein shake & banana", slot: "snack", tag: "veg", items: ["1 scoop whey in water", "1 banana"], kcal: 230, protein: 26, carbs: 30, fat: 2, keywords: ["whey", "dairy", "banana"] },
  { name: "Plant protein smoothie", slot: "snack", tag: "vegan", items: ["1 scoop pea protein", "250ml soy milk", "frozen berries"], kcal: 260, protein: 30, carbs: 22, fat: 6, keywords: ["soy", "berries"] },
  { name: "Mixed nuts & dates", slot: "snack", tag: "vegan", items: ["25g almonds/walnuts", "2 dates"], kcal: 230, protein: 6, carbs: 22, fat: 14, keywords: ["nuts", "almond", "dates"] },
  { name: "Skyr & honey", slot: "snack", tag: "veg", items: ["170g skyr/high-protein yogurt", "1 tsp honey"], kcal: 160, protein: 18, carbs: 18, fat: 1, keywords: ["yogurt", "dairy"] },
  { name: "Boiled eggs & cucumber", slot: "snack", tag: "egg", items: ["2 boiled eggs", "cucumber sticks"], kcal: 160, protein: 13, carbs: 3, fat: 10, keywords: ["egg"] },
  { name: "Tuna rice cakes", slot: "snack", tag: "fish", items: ["95g tuna", "2 rice cakes", "light mayo"], kcal: 220, protein: 24, carbs: 16, fat: 6, keywords: ["tuna", "fish"] },
];

export function mealsFor(diet: Diet, dislikes: string) {
  const allowed = ALLOWED[diet];
  const bad = dislikes
    .toLowerCase()
    .split(/[,;\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
  return MEALS.filter(
    (m) => allowed.includes(m.tag) && !bad.some((b) => m.keywords.some((k) => k.includes(b) || b.includes(k)) || m.name.toLowerCase().includes(b))
  );
}

/** Quick-add foods for the daily log */
export const QUICK_FOODS = [
  { name: "Roti (1)", kcal: 110, protein: 3, carbs: 20, fat: 2 },
  { name: "Cooked rice (150g)", kcal: 195, protein: 4, carbs: 43, fat: 0 },
  { name: "Dal (1 bowl)", kcal: 180, protein: 11, carbs: 26, fat: 4 },
  { name: "Paneer (100g)", kcal: 290, protein: 20, carbs: 4, fat: 22 },
  { name: "Tofu (150g)", kcal: 210, protein: 22, carbs: 3, fat: 12 },
  { name: "Greek yogurt (200g)", kcal: 190, protein: 20, carbs: 8, fat: 8 },
  { name: "Eggs (2)", kcal: 140, protein: 12, carbs: 1, fat: 10 },
  { name: "Chicken breast (150g)", kcal: 245, protein: 46, carbs: 0, fat: 5 },
  { name: "Salmon fillet (150g)", kcal: 310, protein: 32, carbs: 0, fat: 20 },
  { name: "Tuna tin (95g)", kcal: 100, protein: 23, carbs: 0, fat: 1 },
  { name: "Lean beef mince (150g)", kcal: 285, protein: 39, carbs: 0, fat: 14 },
  { name: "Prawns (150g)", kcal: 150, protein: 33, carbs: 0, fat: 2 },
  { name: "Lamb (lean, 150g)", kcal: 300, protein: 38, carbs: 0, fat: 16 },
  { name: "Turkey slices (100g)", kcal: 110, protein: 22, carbs: 2, fat: 2 },
  { name: "Whey shake", kcal: 120, protein: 24, carbs: 3, fat: 1 },
  { name: "Banana", kcal: 105, protein: 1, carbs: 27, fat: 0 },
  { name: "Apple", kcal: 95, protein: 0, carbs: 25, fat: 0 },
  { name: "Almonds (25g)", kcal: 145, protein: 5, carbs: 5, fat: 12 },
  { name: "Oats (50g)", kcal: 190, protein: 7, carbs: 33, fat: 3 },
  { name: "Milk (250ml)", kcal: 160, protein: 8, carbs: 12, fat: 9 },
];
