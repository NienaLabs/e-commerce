// ─── Category-specific filter schemas ─────────────────────────────────────────

export interface FilterOption {
  label: string;
  value: string;
  icon?: string;
}

export interface FilterSection {
  id: string;
  label: string;
  type: 'chips' | 'price-presets' | 'toggle';
  options: FilterOption[];
  multiSelect?: boolean;
}

export interface CategoryFilterSchema {
  categoryLabel: string;
  icon: string;
  sections: FilterSection[];
}

const PRICE_PRESET_OPTIONS: FilterOption[] = [
  { label: 'Under GH₵25', value: '0-25' },
  { label: 'GH₵25 – GH₵50', value: '25-50' },
  { label: 'GH₵50 – GH₵100', value: '50-100' },
  { label: 'GH₵100 – GH₵250', value: '100-250' },
  { label: 'GH₵250 – GH₵500', value: '250-500' },
  { label: 'GH₵500+', value: '500-99999' },
];

export const SORT_OPTIONS: FilterOption[] = [
  { label: 'Recommended', value: 'recommended', icon: 'sparkles-outline' },
  { label: 'Newest First', value: 'newest', icon: 'time-outline' },
  { label: 'Price: Low → High', value: 'price_asc', icon: 'trending-up-outline' },
  { label: 'Price: High → Low', value: 'price_desc', icon: 'trending-down-outline' },
  { label: 'Best Rated', value: 'rating', icon: 'star-outline' },
  { label: 'Best Sellers', value: 'bestsellers', icon: 'flame-outline' },
];

const AVAILABILITY_OPTIONS: FilterOption[] = [
  { label: 'In Stock', value: 'in_stock' },
  { label: 'Pre-Order', value: 'preorder' },
  { label: 'On Sale', value: 'on_sale' },
];

export const CATEGORY_SCHEMAS: Record<string, CategoryFilterSchema> = {
  electronics: {
    categoryLabel: 'Electronics',
    icon: 'hardware-chip-outline',
    sections: [
      {
        id: 'price',
        label: 'Budget',
        type: 'price-presets',
        options: PRICE_PRESET_OPTIONS,
        multiSelect: false,
      },
      {
        id: 'brand',
        label: 'Brand',
        type: 'chips',
        multiSelect: true,
        options: [
          { label: 'Apple', value: 'apple' },
          { label: 'Samsung', value: 'samsung' },
          { label: 'Sony', value: 'sony' },
          { label: 'LG', value: 'lg' },
          { label: 'Bose', value: 'bose' },
          { label: 'Lenovo', value: 'lenovo' },
          { label: 'Dell', value: 'dell' },
          { label: 'HP', value: 'hp' },
        ],
      },
      {
        id: 'storage',
        label: 'Storage',
        type: 'chips',
        multiSelect: true,
        options: [
          { label: '64 GB', value: '64gb' },
          { label: '128 GB', value: '128gb' },
          { label: '256 GB', value: '256gb' },
          { label: '512 GB', value: '512gb' },
          { label: '1 TB', value: '1tb' },
          { label: '2 TB', value: '2tb' },
        ],
      },
      {
        id: 'condition',
        label: 'Condition',
        type: 'chips',
        multiSelect: false,
        options: [
          { label: 'New', value: 'new' },
          { label: 'Refurbished', value: 'refurbished' },
          { label: 'Used – Like New', value: 'used_like_new' },
        ],
      },
      {
        id: 'availability',
        label: 'Availability',
        type: 'chips',
        multiSelect: true,
        options: AVAILABILITY_OPTIONS,
      },
    ],
  },

  fashion: {
    categoryLabel: 'Fashion',
    icon: 'shirt-outline',
    sections: [
      {
        id: 'price',
        label: 'Price Range',
        type: 'price-presets',
        options: PRICE_PRESET_OPTIONS,
        multiSelect: false,
      },
      {
        id: 'gender',
        label: 'For',
        type: 'chips',
        multiSelect: false,
        options: [
          { label: 'Men', value: 'men' },
          { label: 'Women', value: 'women' },
          { label: 'Unisex', value: 'unisex' },
          { label: 'Kids', value: 'kids' },
        ],
      },
      {
        id: 'size',
        label: 'Size',
        type: 'chips',
        multiSelect: true,
        options: [
          { label: 'XS', value: 'xs' },
          { label: 'S', value: 's' },
          { label: 'M', value: 'm' },
          { label: 'L', value: 'l' },
          { label: 'XL', value: 'xl' },
          { label: 'XXL', value: 'xxl' },
          { label: 'XXXL', value: 'xxxl' },
        ],
      },
      {
        id: 'color',
        label: 'Colour',
        type: 'chips',
        multiSelect: true,
        options: [
          { label: 'Black', value: 'black' },
          { label: 'White', value: 'white' },
          { label: 'Navy', value: 'navy' },
          { label: 'Grey', value: 'grey' },
          { label: 'Red', value: 'red' },
          { label: 'Green', value: 'green' },
          { label: 'Blue', value: 'blue' },
          { label: 'Pink', value: 'pink' },
          { label: 'Beige', value: 'beige' },
        ],
      },
      {
        id: 'material',
        label: 'Material',
        type: 'chips',
        multiSelect: true,
        options: [
          { label: 'Cotton', value: 'cotton' },
          { label: 'Linen', value: 'linen' },
          { label: 'Polyester', value: 'polyester' },
          { label: 'Denim', value: 'denim' },
          { label: 'Wool', value: 'wool' },
          { label: 'Silk', value: 'silk' },
          { label: 'Leather', value: 'leather' },
        ],
      },
      {
        id: 'availability',
        label: 'Availability',
        type: 'chips',
        multiSelect: true,
        options: AVAILABILITY_OPTIONS,
      },
    ],
  },

  home: {
    categoryLabel: 'Home & Living',
    icon: 'home-outline',
    sections: [
      {
        id: 'price',
        label: 'Budget',
        type: 'price-presets',
        options: PRICE_PRESET_OPTIONS,
        multiSelect: false,
      },
      {
        id: 'room',
        label: 'Room',
        type: 'chips',
        multiSelect: true,
        options: [
          { label: 'Living Room', value: 'living_room' },
          { label: 'Bedroom', value: 'bedroom' },
          { label: 'Kitchen', value: 'kitchen' },
          { label: 'Bathroom', value: 'bathroom' },
          { label: 'Office', value: 'office' },
          { label: 'Outdoor', value: 'outdoor' },
        ],
      },
      {
        id: 'style',
        label: 'Style',
        type: 'chips',
        multiSelect: true,
        options: [
          { label: 'Modern', value: 'modern' },
          { label: 'Minimalist', value: 'minimalist' },
          { label: 'Scandinavian', value: 'scandinavian' },
          { label: 'Industrial', value: 'industrial' },
          { label: 'Boho', value: 'boho' },
          { label: 'Traditional', value: 'traditional' },
        ],
      },
      {
        id: 'material',
        label: 'Material',
        type: 'chips',
        multiSelect: true,
        options: [
          { label: 'Wood', value: 'wood' },
          { label: 'Metal', value: 'metal' },
          { label: 'Glass', value: 'glass' },
          { label: 'Ceramic', value: 'ceramic' },
          { label: 'Fabric', value: 'fabric' },
          { label: 'Plastic', value: 'plastic' },
        ],
      },
      {
        id: 'color',
        label: 'Colour',
        type: 'chips',
        multiSelect: true,
        options: [
          { label: 'Natural', value: 'natural' },
          { label: 'White', value: 'white' },
          { label: 'Black', value: 'black' },
          { label: 'Grey', value: 'grey' },
          { label: 'Brown', value: 'brown' },
          { label: 'Blue', value: 'blue' },
          { label: 'Green', value: 'green' },
        ],
      },
      {
        id: 'availability',
        label: 'Availability',
        type: 'chips',
        multiSelect: true,
        options: AVAILABILITY_OPTIONS,
      },
    ],
  },

  beauty: {
    categoryLabel: 'Accessories',
    icon: 'watch-outline',
    sections: [
      {
        id: 'price',
        label: 'Price Range',
        type: 'price-presets',
        options: PRICE_PRESET_OPTIONS,
        multiSelect: false,
      },
      {
        id: 'type',
        label: 'Type',
        type: 'chips',
        multiSelect: true,
        options: [
          { label: 'Watches', value: 'watches' },
          { label: 'Bags', value: 'bags' },
          { label: 'Jewellery', value: 'jewellery' },
          { label: 'Sunglasses', value: 'sunglasses' },
          { label: 'Belts', value: 'belts' },
          { label: 'Hats & Caps', value: 'hats' },
          { label: 'Wallets', value: 'wallets' },
          { label: 'Scarves', value: 'scarves' },
        ],
      },
      {
        id: 'gender',
        label: 'For',
        type: 'chips',
        multiSelect: false,
        options: [
          { label: 'Men', value: 'men' },
          { label: 'Women', value: 'women' },
          { label: 'Unisex', value: 'unisex' },
        ],
      },
      {
        id: 'material',
        label: 'Material',
        type: 'chips',
        multiSelect: true,
        options: [
          { label: 'Leather', value: 'leather' },
          { label: 'Gold', value: 'gold' },
          { label: 'Silver', value: 'silver' },
          { label: 'Stainless Steel', value: 'steel' },
          { label: 'Canvas', value: 'canvas' },
          { label: 'Fabric', value: 'fabric' },
        ],
      },
      {
        id: 'availability',
        label: 'Availability',
        type: 'chips',
        multiSelect: true,
        options: AVAILABILITY_OPTIONS,
      },
    ],
  },

  sports: {
    categoryLabel: 'Sports',
    icon: 'football-outline',
    sections: [
      {
        id: 'price',
        label: 'Budget',
        type: 'price-presets',
        options: PRICE_PRESET_OPTIONS,
        multiSelect: false,
      },
      {
        id: 'sport',
        label: 'Sport',
        type: 'chips',
        multiSelect: true,
        options: [
          { label: 'Football', value: 'football' },
          { label: 'Basketball', value: 'basketball' },
          { label: 'Tennis', value: 'tennis' },
          { label: 'Running', value: 'running' },
          { label: 'Cycling', value: 'cycling' },
          { label: 'Swimming', value: 'swimming' },
          { label: 'Gym / Fitness', value: 'gym' },
          { label: 'Yoga', value: 'yoga' },
          { label: 'Hiking', value: 'hiking' },
        ],
      },
      {
        id: 'gender',
        label: 'For',
        type: 'chips',
        multiSelect: false,
        options: [
          { label: 'Men', value: 'men' },
          { label: 'Women', value: 'women' },
          { label: 'Kids', value: 'kids' },
          { label: 'Unisex', value: 'unisex' },
        ],
      },
      {
        id: 'brand',
        label: 'Brand',
        type: 'chips',
        multiSelect: true,
        options: [
          { label: 'Nike', value: 'nike' },
          { label: 'Adidas', value: 'adidas' },
          { label: 'Puma', value: 'puma' },
          { label: 'Under Armour', value: 'under_armour' },
          { label: 'Reebok', value: 'reebok' },
          { label: 'New Balance', value: 'new_balance' },
          { label: 'Wilson', value: 'wilson' },
        ],
      },
      {
        id: 'availability',
        label: 'Availability',
        type: 'chips',
        multiSelect: true,
        options: AVAILABILITY_OPTIONS,
      },
    ],
  },

  food: {
    categoryLabel: 'Food',
    icon: 'restaurant-outline',
    sections: [
      {
        id: 'price',
        label: 'Price Range',
        type: 'price-presets',
        options: PRICE_PRESET_OPTIONS,
        multiSelect: false,
      },
      {
        id: 'diet',
        label: 'Dietary',
        type: 'chips',
        multiSelect: true,
        options: [
          { label: 'Vegan', value: 'vegan' },
          { label: 'Vegetarian', value: 'vegetarian' },
          { label: 'Gluten-Free', value: 'gluten_free' },
          { label: 'Dairy-Free', value: 'dairy_free' },
          { label: 'Keto', value: 'keto' },
          { label: 'Organic', value: 'organic' },
          { label: 'Halal', value: 'halal' },
          { label: 'Kosher', value: 'kosher' },
        ],
      },
      {
        id: 'type',
        label: 'Category',
        type: 'chips',
        multiSelect: true,
        options: [
          { label: 'Snacks', value: 'snacks' },
          { label: 'Drinks', value: 'drinks' },
          { label: 'Fresh Produce', value: 'fresh' },
          { label: 'Pantry', value: 'pantry' },
          { label: 'Frozen', value: 'frozen' },
          { label: 'Bakery', value: 'bakery' },
          { label: 'Supplements', value: 'supplements' },
        ],
      },
      {
        id: 'availability',
        label: 'Availability',
        type: 'chips',
        multiSelect: true,
        options: AVAILABILITY_OPTIONS,
      },
    ],
  },

  gaming: {
    categoryLabel: 'Gaming',
    icon: 'game-controller-outline',
    sections: [
      {
        id: 'price',
        label: 'Budget',
        type: 'price-presets',
        options: PRICE_PRESET_OPTIONS,
        multiSelect: false,
      },
      {
        id: 'platform',
        label: 'Platform',
        type: 'chips',
        multiSelect: true,
        options: [
          { label: 'PlayStation 5', value: 'ps5' },
          { label: 'PlayStation 4', value: 'ps4' },
          { label: 'Xbox Series X', value: 'xbox_x' },
          { label: 'Xbox One', value: 'xbox_one' },
          { label: 'Nintendo Switch', value: 'switch' },
          { label: 'PC', value: 'pc' },
          { label: 'Mobile', value: 'mobile' },
        ],
      },
      {
        id: 'genre',
        label: 'Genre',
        type: 'chips',
        multiSelect: true,
        options: [
          { label: 'Action', value: 'action' },
          { label: 'RPG', value: 'rpg' },
          { label: 'Sports', value: 'sports' },
          { label: 'Shooter', value: 'shooter' },
          { label: 'Strategy', value: 'strategy' },
          { label: 'Simulation', value: 'simulation' },
          { label: 'Adventure', value: 'adventure' },
          { label: 'Fighting', value: 'fighting' },
        ],
      },
      {
        id: 'type',
        label: 'Product Type',
        type: 'chips',
        multiSelect: true,
        options: [
          { label: 'Games', value: 'games' },
          { label: 'Consoles', value: 'consoles' },
          { label: 'Controllers', value: 'controllers' },
          { label: 'Headsets', value: 'headsets' },
          { label: 'Accessories', value: 'accessories' },
          { label: 'Gift Cards', value: 'gift_cards' },
        ],
      },
      {
        id: 'availability',
        label: 'Availability',
        type: 'chips',
        multiSelect: true,
        options: AVAILABILITY_OPTIONS,
      },
    ],
  },

  books: {
    categoryLabel: 'Books',
    icon: 'book-outline',
    sections: [
      {
        id: 'price',
        label: 'Price Range',
        type: 'price-presets',
        options: PRICE_PRESET_OPTIONS,
        multiSelect: false,
      },
      {
        id: 'format',
        label: 'Format',
        type: 'chips',
        multiSelect: false,
        options: [
          { label: 'Paperback', value: 'paperback' },
          { label: 'Hardcover', value: 'hardcover' },
          { label: 'eBook', value: 'ebook' },
          { label: 'Audiobook', value: 'audiobook' },
        ],
      },
      {
        id: 'genre',
        label: 'Genre',
        type: 'chips',
        multiSelect: true,
        options: [
          { label: 'Fiction', value: 'fiction' },
          { label: 'Non-Fiction', value: 'non_fiction' },
          { label: 'Self-Help', value: 'self_help' },
          { label: 'Business', value: 'business' },
          { label: 'Biography', value: 'biography' },
          { label: 'Science', value: 'science' },
          { label: 'History', value: 'history' },
          { label: "Children's", value: 'children' },
          { label: 'Comics', value: 'comics' },
        ],
      },
      {
        id: 'language',
        label: 'Language',
        type: 'chips',
        multiSelect: false,
        options: [
          { label: 'English', value: 'english' },
          { label: 'French', value: 'french' },
          { label: 'Spanish', value: 'spanish' },
          { label: 'Arabic', value: 'arabic' },
          { label: 'German', value: 'german' },
        ],
      },
      {
        id: 'availability',
        label: 'Availability',
        type: 'chips',
        multiSelect: true,
        options: AVAILABILITY_OPTIONS,
      },
    ],
  },

  wearables: {
    categoryLabel: 'Wearables',
    icon: 'watch-outline',
    sections: [
      { id: 'price', label: 'Budget', type: 'price-presets', options: PRICE_PRESET_OPTIONS, multiSelect: false },
      {
        id: 'type', label: 'Type', type: 'chips', multiSelect: true,
        options: [
          { label: 'Smartwatches', value: 'smartwatch' },
          { label: 'Fitness Trackers', value: 'fitness_tracker' },
          { label: 'Smart Glasses', value: 'smart_glasses' },
          { label: 'VR Headsets', value: 'vr_headset' },
          { label: 'Smart Rings', value: 'smart_ring' },
        ],
      },
      {
        id: 'brand', label: 'Brand', type: 'chips', multiSelect: true,
        options: [
          { label: 'Apple', value: 'apple' },
          { label: 'Samsung', value: 'samsung' },
          { label: 'Garmin', value: 'garmin' },
          { label: 'Fitbit', value: 'fitbit' },
          { label: 'Amazfit', value: 'amazfit' },
          { label: 'Huawei', value: 'huawei' },
        ],
      },
      {
        id: 'compatibility', label: 'Compatibility', type: 'chips', multiSelect: true,
        options: [
          { label: 'iOS', value: 'ios' },
          { label: 'Android', value: 'android' },
          { label: 'Universal', value: 'universal' },
        ],
      },
      {
        id: 'condition', label: 'Condition', type: 'chips', multiSelect: false,
        options: [
          { label: 'New', value: 'new' },
          { label: 'Refurbished', value: 'refurbished' },
          { label: 'Used', value: 'used' },
        ],
      },
      { id: 'availability', label: 'Availability', type: 'chips', multiSelect: true, options: AVAILABILITY_OPTIONS },
    ],
  },

  cameras: {
    categoryLabel: 'Cameras & Photography',
    icon: 'camera-outline',
    sections: [
      { id: 'price', label: 'Budget', type: 'price-presets', options: PRICE_PRESET_OPTIONS, multiSelect: false },
      {
        id: 'type', label: 'Type', type: 'chips', multiSelect: true,
        options: [
          { label: 'DSLR', value: 'dslr' },
          { label: 'Mirrorless', value: 'mirrorless' },
          { label: 'Point & Shoot', value: 'point_and_shoot' },
          { label: 'Action Cameras', value: 'action_camera' },
          { label: 'Film Cameras', value: 'film_camera' },
          { label: 'Lenses', value: 'lens' },
          { label: 'Tripods & Mounts', value: 'tripod' },
          { label: 'Camera Bags', value: 'camera_bag' },
        ],
      },
      {
        id: 'brand', label: 'Brand', type: 'chips', multiSelect: true,
        options: [
          { label: 'Canon', value: 'canon' },
          { label: 'Nikon', value: 'nikon' },
          { label: 'Sony', value: 'sony' },
          { label: 'Fujifilm', value: 'fujifilm' },
          { label: 'Panasonic', value: 'panasonic' },
          { label: 'GoPro', value: 'gopro' },
          { label: 'DJI', value: 'dji' },
          { label: 'Olympus', value: 'olympus' },
        ],
      },
      {
        id: 'condition', label: 'Condition', type: 'chips', multiSelect: false,
        options: [
          { label: 'New', value: 'new' },
          { label: 'Refurbished', value: 'refurbished' },
          { label: 'Used – Like New', value: 'used_like_new' },
        ],
      },
      { id: 'availability', label: 'Availability', type: 'chips', multiSelect: true, options: AVAILABILITY_OPTIONS },
    ],
  },

  home_appliances: {
    categoryLabel: 'Home Appliances',
    icon: 'flash-outline',
    sections: [
      { id: 'price', label: 'Budget', type: 'price-presets', options: PRICE_PRESET_OPTIONS, multiSelect: false },
      {
        id: 'type', label: 'Type', type: 'chips', multiSelect: true,
        options: [
          { label: 'Kitchen', value: 'kitchen' },
          { label: 'Cleaning', value: 'cleaning' },
          { label: 'Climate Control', value: 'climate' },
          { label: 'Laundry', value: 'laundry' },
          { label: 'Refrigerators', value: 'refrigerator' },
          { label: 'Water Purifiers', value: 'water_purifier' },
          { label: 'Air Purifiers', value: 'air_purifier' },
        ],
      },
      {
        id: 'brand', label: 'Brand', type: 'chips', multiSelect: true,
        options: [
          { label: 'Dyson', value: 'dyson' },
          { label: 'LG', value: 'lg' },
          { label: 'Samsung', value: 'samsung' },
          { label: 'Whirlpool', value: 'whirlpool' },
          { label: 'Bosch', value: 'bosch' },
          { label: 'Philips', value: 'philips' },
          { label: 'Panasonic', value: 'panasonic' },
          { label: 'GE Appliances', value: 'ge' },
        ],
      },
      { id: 'availability', label: 'Availability', type: 'chips', multiSelect: true, options: AVAILABILITY_OPTIONS },
    ],
  },

  health_beauty: {
    categoryLabel: 'Health & Beauty',
    icon: 'rose-outline',
    sections: [
      { id: 'price', label: 'Price Range', type: 'price-presets', options: PRICE_PRESET_OPTIONS, multiSelect: false },
      {
        id: 'type', label: 'Category', type: 'chips', multiSelect: true,
        options: [
          { label: 'Skincare', value: 'skincare' },
          { label: 'Makeup', value: 'makeup' },
          { label: 'Haircare', value: 'haircare' },
          { label: 'Fragrance', value: 'fragrance' },
          { label: 'Personal Care', value: 'personal_care' },
          { label: 'Supplements', value: 'supplements' },
          { label: 'Medical Devices', value: 'medical_devices' },
          { label: 'Oral Care', value: 'oral_care' },
        ],
      },
      {
        id: 'skin_type', label: 'Skin Type', type: 'chips', multiSelect: true,
        options: [
          { label: 'All Types', value: 'all' },
          { label: 'Oily', value: 'oily' },
          { label: 'Dry', value: 'dry' },
          { label: 'Combination', value: 'combination' },
          { label: 'Sensitive', value: 'sensitive' },
        ],
      },
      {
        id: 'gender', label: 'For', type: 'chips', multiSelect: false,
        options: [
          { label: 'All', value: 'all' },
          { label: 'Women', value: 'women' },
          { label: 'Men', value: 'men' },
        ],
      },
      { id: 'availability', label: 'Availability', type: 'chips', multiSelect: true, options: AVAILABILITY_OPTIONS },
    ],
  },

  automotive: {
    categoryLabel: 'Automotive',
    icon: 'car-outline',
    sections: [
      { id: 'price', label: 'Price Range', type: 'price-presets', options: PRICE_PRESET_OPTIONS, multiSelect: false },
      {
        id: 'type', label: 'Type', type: 'chips', multiSelect: true,
        options: [
          { label: 'Car Parts', value: 'car_parts' },
          { label: 'Accessories', value: 'accessories' },
          { label: 'Tools & Equipment', value: 'tools' },
          { label: 'Car Care & Cleaning', value: 'car_care' },
          { label: 'Lighting', value: 'lighting' },
          { label: 'Audio & Electronics', value: 'audio_electronics' },
          { label: 'Tires & Wheels', value: 'tires_wheels' },
          { label: 'Motorbike', value: 'motorbike' },
        ],
      },
      { id: 'availability', label: 'Availability', type: 'chips', multiSelect: true, options: AVAILABILITY_OPTIONS },
    ],
  },

  toys: {
    categoryLabel: 'Toys & Hobbies',
    icon: 'extension-puzzle-outline',
    sections: [
      { id: 'price', label: 'Price Range', type: 'price-presets', options: PRICE_PRESET_OPTIONS, multiSelect: false },
      {
        id: 'age', label: 'Age Group', type: 'chips', multiSelect: true,
        options: [
          { label: '0–2 Years', value: '0-2' },
          { label: '3–5 Years', value: '3-5' },
          { label: '6–8 Years', value: '6-8' },
          { label: '9–12 Years', value: '9-12' },
          { label: '13+ Years', value: '13+' },
        ],
      },
      {
        id: 'type', label: 'Type', type: 'chips', multiSelect: true,
        options: [
          { label: 'Educational', value: 'educational' },
          { label: 'Action Figures', value: 'action_figures' },
          { label: 'Board Games', value: 'board_games' },
          { label: 'Building Blocks', value: 'building_blocks' },
          { label: 'Dolls & Plush', value: 'dolls' },
          { label: 'Remote Control', value: 'remote_control' },
          { label: 'Outdoor Play', value: 'outdoor_play' },
          { label: 'Arts & Crafts', value: 'arts_crafts' },
        ],
      },
      { id: 'availability', label: 'Availability', type: 'chips', multiSelect: true, options: AVAILABILITY_OPTIONS },
    ],
  },

  computers: {
    categoryLabel: 'Computers & Tablets',
    icon: 'laptop-outline',
    sections: [
      { id: 'price', label: 'Budget', type: 'price-presets', options: PRICE_PRESET_OPTIONS, multiSelect: false },
      {
        id: 'type', label: 'Type', type: 'chips', multiSelect: true,
        options: [
          { label: 'Laptops', value: 'laptop' },
          { label: 'Desktops', value: 'desktop' },
          { label: 'Tablets', value: 'tablet' },
          { label: 'Monitors', value: 'monitor' },
          { label: 'Keyboards & Mice', value: 'peripherals' },
          { label: 'Hard Drives & SSDs', value: 'storage' },
          { label: 'RAM & Memory', value: 'memory' },
          { label: 'Graphics Cards', value: 'gpu' },
        ],
      },
      {
        id: 'brand', label: 'Brand', type: 'chips', multiSelect: true,
        options: [
          { label: 'Apple', value: 'apple' },
          { label: 'Dell', value: 'dell' },
          { label: 'HP', value: 'hp' },
          { label: 'Lenovo', value: 'lenovo' },
          { label: 'ASUS', value: 'asus' },
          { label: 'Acer', value: 'acer' },
          { label: 'Microsoft', value: 'microsoft' },
          { label: 'Samsung', value: 'samsung' },
        ],
      },
      {
        id: 'ram', label: 'RAM', type: 'chips', multiSelect: true,
        options: [
          { label: '4 GB', value: '4gb' },
          { label: '8 GB', value: '8gb' },
          { label: '16 GB', value: '16gb' },
          { label: '32 GB', value: '32gb' },
          { label: '64 GB+', value: '64gb+' },
        ],
      },
      {
        id: 'storage', label: 'Storage', type: 'chips', multiSelect: true,
        options: [
          { label: '128 GB', value: '128gb' },
          { label: '256 GB', value: '256gb' },
          { label: '512 GB', value: '512gb' },
          { label: '1 TB', value: '1tb' },
          { label: '2 TB+', value: '2tb+' },
        ],
      },
      {
        id: 'condition', label: 'Condition', type: 'chips', multiSelect: false,
        options: [
          { label: 'New', value: 'new' },
          { label: 'Refurbished', value: 'refurbished' },
          { label: 'Used', value: 'used' },
        ],
      },
      { id: 'availability', label: 'Availability', type: 'chips', multiSelect: true, options: AVAILABILITY_OPTIONS },
    ],
  },

  phones: {
    categoryLabel: 'Mobile Phones',
    icon: 'phone-portrait-outline',
    sections: [
      { id: 'price', label: 'Budget', type: 'price-presets', options: PRICE_PRESET_OPTIONS, multiSelect: false },
      {
        id: 'brand', label: 'Brand', type: 'chips', multiSelect: true,
        options: [
          { label: 'Apple', value: 'apple' },
          { label: 'Samsung', value: 'samsung' },
          { label: 'Google', value: 'google' },
          { label: 'OnePlus', value: 'oneplus' },
          { label: 'Xiaomi', value: 'xiaomi' },
          { label: 'Huawei', value: 'huawei' },
          { label: 'Motorola', value: 'motorola' },
          { label: 'Nokia', value: 'nokia' },
        ],
      },
      {
        id: 'storage', label: 'Storage', type: 'chips', multiSelect: true,
        options: [
          { label: '64 GB', value: '64gb' },
          { label: '128 GB', value: '128gb' },
          { label: '256 GB', value: '256gb' },
          { label: '512 GB', value: '512gb' },
          { label: '1 TB', value: '1tb' },
        ],
      },
      {
        id: 'os', label: 'Operating System', type: 'chips', multiSelect: false,
        options: [
          { label: 'iOS', value: 'ios' },
          { label: 'Android', value: 'android' },
        ],
      },
      {
        id: 'condition', label: 'Condition', type: 'chips', multiSelect: false,
        options: [
          { label: 'New', value: 'new' },
          { label: 'Refurbished', value: 'refurbished' },
          { label: 'Used – Like New', value: 'used_like_new' },
          { label: 'Used – Good', value: 'used_good' },
        ],
      },
      { id: 'availability', label: 'Availability', type: 'chips', multiSelect: true, options: AVAILABILITY_OPTIONS },
    ],
  },

  outdoor: {
    categoryLabel: 'Sports & Outdoors',
    icon: 'bicycle-outline',
    sections: [
      { id: 'price', label: 'Budget', type: 'price-presets', options: PRICE_PRESET_OPTIONS, multiSelect: false },
      {
        id: 'type', label: 'Type', type: 'chips', multiSelect: true,
        options: [
          { label: 'Camping & Hiking', value: 'camping' },
          { label: 'Cycling', value: 'cycling' },
          { label: 'Water Sports', value: 'water_sports' },
          { label: 'Gym & Fitness', value: 'gym' },
          { label: 'Running', value: 'running' },
          { label: 'Team Sports', value: 'team_sports' },
          { label: 'Yoga & Pilates', value: 'yoga' },
          { label: 'Climbing', value: 'climbing' },
        ],
      },
      {
        id: 'brand', label: 'Brand', type: 'chips', multiSelect: true,
        options: [
          { label: 'Nike', value: 'nike' },
          { label: 'Adidas', value: 'adidas' },
          { label: 'The North Face', value: 'north_face' },
          { label: 'Decathlon', value: 'decathlon' },
          { label: 'Columbia', value: 'columbia' },
          { label: 'Puma', value: 'puma' },
          { label: 'Under Armour', value: 'under_armour' },
          { label: 'Salomon', value: 'salomon' },
        ],
      },
      { id: 'availability', label: 'Availability', type: 'chips', multiSelect: true, options: AVAILABILITY_OPTIONS },
    ],
  },

  art_crafts: {
    categoryLabel: 'Art & Craft Supplies',
    icon: 'color-palette-outline',
    sections: [
      { id: 'price', label: 'Price Range', type: 'price-presets', options: PRICE_PRESET_OPTIONS, multiSelect: false },
      {
        id: 'type', label: 'Type', type: 'chips', multiSelect: true,
        options: [
          { label: 'Paints & Brushes', value: 'paints' },
          { label: 'Drawing & Sketching', value: 'drawing' },
          { label: 'Sewing & Knitting', value: 'sewing' },
          { label: 'Scrapbooking', value: 'scrapbooking' },
          { label: 'Sculpture & Clay', value: 'sculpture' },
          { label: 'Paper Crafts', value: 'paper_crafts' },
          { label: 'Jewellery Making', value: 'jewellery_making' },
        ],
      },
      { id: 'availability', label: 'Availability', type: 'chips', multiSelect: true, options: AVAILABILITY_OPTIONS },
    ],
  },

  pet_supplies: {
    categoryLabel: 'Pet Supplies',
    icon: 'paw-outline',
    sections: [
      { id: 'price', label: 'Price Range', type: 'price-presets', options: PRICE_PRESET_OPTIONS, multiSelect: false },
      {
        id: 'pet', label: 'Pet Type', type: 'chips', multiSelect: true,
        options: [
          { label: 'Dogs', value: 'dog' },
          { label: 'Cats', value: 'cat' },
          { label: 'Birds', value: 'bird' },
          { label: 'Fish', value: 'fish' },
          { label: 'Small Animals', value: 'small_animal' },
        ],
      },
      {
        id: 'type', label: 'Category', type: 'chips', multiSelect: true,
        options: [
          { label: 'Food & Treats', value: 'food' },
          { label: 'Toys', value: 'toys' },
          { label: 'Grooming', value: 'grooming' },
          { label: 'Beds & Furniture', value: 'beds' },
          { label: 'Accessories', value: 'accessories' },
          { label: 'Health & Vet', value: 'health' },
        ],
      },
      { id: 'availability', label: 'Availability', type: 'chips', multiSelect: true, options: AVAILABILITY_OPTIONS },
    ],
  },
};


// Default schema when no category is selected or category is unknown
export const DEFAULT_SCHEMA: CategoryFilterSchema = {
  categoryLabel: 'All Products',
  icon: 'grid-outline',
  sections: [
    {
      id: 'price',
      label: 'Price Range',
      type: 'price-presets',
      options: PRICE_PRESET_OPTIONS,
      multiSelect: false,
    },
    {
      id: 'condition',
      label: 'Condition',
      type: 'chips',
      multiSelect: false,
      options: [
        { label: 'New', value: 'new' },
        { label: 'Refurbished', value: 'refurbished' },
        { label: 'Used', value: 'used' },
      ],
    },
    {
      id: 'availability',
      label: 'Availability',
      type: 'chips',
      multiSelect: true,
      options: AVAILABILITY_OPTIONS,
    },
  ],
};
