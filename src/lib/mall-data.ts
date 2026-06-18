import {
  Accessibility, BadgePercent, Banknote, Car, Coffee, ConciergeBell, HeartPulse,
  Info, Scissors, Shirt, ShoppingBasket, Sparkles, Utensils,
} from "lucide-react";

export type Locale = "en" | "th" | "cn";
export type Category = { slug: string; names: Record<Locale, string>; description: Record<Locale, string>; icon: typeof Coffee };
export type Store = { id: string; name: string; category: string; floor: string; hours: string; description: string; accent: string; nodeId: string; tags?: string[] };

export const categories: Category[] = [
  { slug: "restaurants", names: { en: "Restaurants", th: "ร้านอาหาร", cn: "餐厅" }, description: { en: "Dining options for every taste", th: "ตัวเลือกอาหารหลากหลาย", cn: "各种美食选择" }, icon: Utensils },
  { slug: "cafes", names: { en: "Cafes", th: "คาเฟ่", cn: "咖啡厅" }, description: { en: "Coffee and light bites", th: "กาแฟและขนมเค้ก", cn: "咖啡和轻食" }, icon: Coffee },
  { slug: "fashion", names: { en: "Fashion", th: "แฟชั่น", cn: "时尚" }, description: { en: "Clothing and accessories", th: "เสื้อผ้าและเครื่องประดับ", cn: "服装和配饰" }, icon: Shirt },
  { slug: "beauty", names: { en: "Beauty", th: "ความงาม", cn: "美妆" }, description: { en: "Skincare and cosmetics", th: "ผลิตดูแลและเครื่องสำอาง", cn: "护肤和化妆品" }, icon: Sparkles },
  { slug: "supermarket", names: { en: "Supermarket", th: "ซูเปอร์มาร์เก็ต", cn: "超市" }, description: { en: "Groceries and essentials", th: "ของช้อปและของใช้ประจำา", cn: "杂货和日用品" }, icon: ShoppingBasket },
  { slug: "services", names: { en: "Services", th: "บริการ", cn: "服务" }, description: { en: "Customer services", th: "บริการลูกค้า", cn: "客户服务" }, icon: ConciergeBell },
  { slug: "restrooms", names: { en: "Restrooms", th: "ห้องน้ำ", cn: "洗手间" }, description: { en: "Convenient facilities", th: "สิ่งอำนวยความสะดวก", cn: "便利设施" }, icon: Accessibility },
  { slug: "atm", names: { en: "ATM", th: "เอทีเอ็ม", cn: "自动取款机" }, description: { en: "Cash access", th: "บริการเงินสด", cn: "现金服务" }, icon: Banknote },
  { slug: "pharmacy", names: { en: "Pharmacy", th: "ร้านขายยา", cn: "药房" }, description: { en: "Health and wellness", th: "สุขภาพและความเป็นอยู่", cn: "健康保健" }, icon: HeartPulse },
  { slug: "information", names: { en: "Information", th: "ประชาสัมพันธ์", cn: "服务台" }, description: { en: "Help and assistance", th: "ข้อมูลและความช่วยเหลือ", cn: "信息与协助" }, icon: Info },
  { slug: "parking", names: { en: "Parking", th: "ที่จอดรถ", cn: "停车场" }, description: { en: "Vehicle parking", th: "ที่จอดรถยานพาหนะ", cn: "车辆停车" }, icon: Car },
  { slug: "promotions", names: { en: "Promotions", th: "โปรโมชั่น", cn: "优惠" }, description: { en: "Special offers", th: "ข้อเสนอพิเศษ", cn: "特别优惠" }, icon: BadgePercent },
];

export const stores: Store[] = [
  { id: "s1", name: "Siam Tea Atelier", category: "cafes", floor: "G", hours: "10:00 – 22:00", description: "Single-origin Thai tea, pastries and quiet courtyard seating.", accent: "ST", nodeId: "g4", tags: ["Premium", "Quiet"] },
  { id: "s2", name: "Maison Lumière", category: "fashion", floor: "2", hours: "10:00 – 21:30", description: "Contemporary womenswear and hand-finished accessories.", accent: "ML", nodeId: "f24", tags: ["Luxury", "Womenswear"] },
  { id: "s3", name: "Nara Table", category: "restaurants", floor: "2", hours: "11:00 – 22:00", description: "Modern Thai dining with a seasonal chef's menu.", accent: "NT", nodeId: "f25", tags: ["Thai", "Fine Dining"] },
  { id: "s4", name: "Golden Grocer", category: "supermarket", floor: "B1", hours: "08:00 – 23:00", description: "Premium produce, pantry staples and ready-to-eat meals.", accent: "GG", nodeId: "b3", tags: ["Organic", "Ready-to-eat"] },
  { id: "s5", name: "Aster Beauty", category: "beauty", floor: "1", hours: "10:00 – 22:00", description: "Curated skincare, fragrance and personal beauty services.", accent: "AB", nodeId: "f14", tags: ["Skincare", "Services"] },
  { id: "s6", name: "Well Pharmacy", category: "pharmacy", floor: "G", hours: "09:00 – 22:00", description: "Pharmacy, wellness essentials and pharmacist consultation.", accent: "WP", nodeId: "g5", tags: ["Health", "Consultation"] },
];

export const kiosk = { id: "KIOSK-GF-01", nodeId: "g1", floor: "G", label: "Grand Atrium" };