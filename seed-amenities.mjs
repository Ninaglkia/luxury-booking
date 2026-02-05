import postgres from "postgres";
import * as dotenv from 'dotenv';
dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const sql = postgres(process.env.DATABASE_URL);

const defaultAmenities = [
  // Views
  { name: "Vista Mare", icon: "Waves", category: "view" },
  { name: "Vista Montagna", icon: "Mountain", category: "view" },
  { name: "Vista Lago", icon: "Droplets", category: "view" },
  { name: "Vista Panoramica", icon: "Eye", category: "view" },
  
  // Facilities
  { name: "Piscina Privata", icon: "Waves", category: "facility" },
  { name: "Piscina Riscaldata", icon: "Flame", category: "facility" },
  { name: "Jacuzzi", icon: "Bath", category: "facility" },
  { name: "Sauna", icon: "Droplet", category: "facility" },
  { name: "Palestra", icon: "Dumbbell", category: "facility" },
  { name: "Cinema Privato", icon: "Film", category: "facility" },
  { name: "Campo da Tennis", icon: "Trophy", category: "facility" },
  { name: "Eliporto", icon: "Plane", category: "facility" },
  
  // Services
  { name: "Chef Privato", icon: "ChefHat", category: "service" },
  { name: "Maggiordomo", icon: "UserCheck", category: "service" },
  { name: "Servizio Pulizie Giornaliero", icon: "Sparkles", category: "service" },
  { name: "Concierge 24/7", icon: "Phone", category: "service" },
  { name: "Autista Privato", icon: "Car", category: "service" },
  
  // Amenities
  { name: "Wi-Fi Alta Velocità", icon: "Wifi", category: "amenity" },
  { name: "Aria Condizionata", icon: "Wind", category: "amenity" },
  { name: "Riscaldamento", icon: "Flame", category: "amenity" },
  { name: "Camino", icon: "Flame", category: "amenity" },
  { name: "Cucina Gourmet", icon: "UtensilsCrossed", category: "amenity" },
  { name: "Cantina Vini", icon: "Wine", category: "amenity" },
  { name: "Giardino Privato", icon: "Trees", category: "amenity" },
  { name: "Terrazza", icon: "Home", category: "amenity" },
  { name: "Parcheggio Privato", icon: "ParkingCircle", category: "amenity" },
  { name: "Sistema di Sicurezza", icon: "Shield", category: "amenity" },
];

async function seedAmenities() {
  console.log("Seeding amenities...");
  
  for (const amenity of defaultAmenities) {
    try {
      await sql`
        insert into "amenities" ("name", "icon", "category")
        values (${amenity.name}, ${amenity.icon}, ${amenity.category})
        on conflict ("name")
        do update set
          "icon" = excluded."icon",
          "category" = excluded."category"
      `;
      console.log(`✓ ${amenity.name}`);
    } catch (error) {
      console.error(`✗ ${amenity.name}:`, error.message);
    }
  }
  
  console.log("Amenities seeded successfully!");
  await sql.end();
}

seedAmenities().catch(async (error) => {
  console.error("Seed failed:", error?.message ?? error);
  try {
    await sql.end();
  } catch {
    // ignore
  }
  process.exit(1);
});
