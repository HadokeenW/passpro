import {
  PrismaClient,
  Role,
  CardStatus,
  PaymentMethod,
  AccessDecision,
  AccessReason,
  AccessSource,
  AlertLevel,
  AlertType,
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  if (process.env.SEED !== "true") {
    console.log("SEED environment variable is not 'true', skipping seed.");
    return;
  }

  console.log("Seeding database with WAL mode...");
  await prisma.$queryRawUnsafe("PRAGMA journal_mode = WAL;");

  // 1. Singleton Settings
  await prisma.setting.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      gymName: "PASSPro Fitness Club",
      gymPhone: "0550 12 34 56",
      gymEmail: "contact@passpro.dz",
      gymAddress: "14 Rue Didouche Mourad, Alger",
      currency: "DA",
      timezone: "Africa/Algiers",
      dateFormat: "dd/MM/yyyy",
      kioskName: "BORNE-01",
      simulationMode: true,
      receiptFooter: "Merci de votre fidélité et à bientôt !",
    },
  });

  // 2. Users / Operators
  const defaultPassword = await bcrypt.hash("passpro2026", 12);
  const users = [
    { username: "admin", name: "Administrateur", role: Role.ADMIN, active: true },
    { username: "manager", name: "Responsable Salle", role: Role.MANAGER, active: true },
    { username: "reception", name: "Inès Réception", role: Role.RECEPTIONIST, active: true },
    { username: "borne", name: "Borne Entrée (Désactivé)", role: Role.ACCESS_GUARD, active: false },
  ];

  const createdUsers: Record<string, string> = {};
  for (const u of users) {
    const user = await prisma.user.upsert({
      where: { username: u.username },
      update: { name: u.name, role: u.role, active: u.active },
      create: {
        username: u.username,
        name: u.name,
        passwordHash: defaultPassword,
        role: u.role,
        active: u.active,
      },
    });
    createdUsers[u.username] = user.id;
  }

  // 3. Plans
  const plansData = [
    { name: "Pass Journée", price: 500, durationDays: 1, sortOrder: 1, description: "Accès libre pour la journée", planType: "TEMPORAL" as const },
    { name: "Semaine", price: 2000, durationDays: 7, sortOrder: 2, description: "Accès 7 jours consécutifs", planType: "TEMPORAL" as const },
    { name: "Mensuel", price: 5500, durationDays: 30, sortOrder: 3, description: "Formule mensuelle standard", planType: "TEMPORAL" as const },
    { name: "Trimestriel", price: 14000, durationDays: 90, sortOrder: 4, description: "Engagement 3 mois avantageux", planType: "TEMPORAL" as const },
    { name: "Semestriel", price: 25000, durationDays: 180, sortOrder: 5, description: "Engagement 6 mois", planType: "TEMPORAL" as const },
    { name: "Annuel", price: 45000, durationDays: 365, sortOrder: 6, description: "Accès illimité toute l'année", planType: "TEMPORAL" as const },
    { name: "Carnet 10 Séances", price: 6000, durationDays: 90, sortOrder: 7, description: "10 entrées valables 90 jours", planType: "SESSIONS" as const, sessionCount: 10 },
    { name: "Carnet 20 Séances", price: 10000, durationDays: 180, sortOrder: 8, description: "20 entrées valables 180 jours", planType: "SESSIONS" as const, sessionCount: 20 },
    { name: "Heures Creuses (13h-16h)", price: 3500, durationDays: 30, sortOrder: 9, description: "Accès de 13h00 à 16h00 chaque jour", planType: "TIME_SLOT" as const, startTime: "13:00", endTime: "16:00" },
  ];

  const createdPlans: Record<string, string> = {};
  for (const p of plansData) {
    const existing = await prisma.plan.findFirst({ where: { name: p.name } });
    if (existing) {
      const updated = await prisma.plan.update({
        where: { id: existing.id },
        data: p,
      });
      createdPlans[p.name] = updated.id;
    } else {
      const plan = await prisma.plan.create({ data: p });
      createdPlans[p.name] = plan.id;
    }
  }

  // 4. Members
  const membersData = [
    { firstName: "Amine", lastName: "Belkacem", phone: "0551 23 45 67", email: "amine.belkacem@gmail.com", notes: "Adhérent assidu" },
    { firstName: "Karim", lastName: "Hadj", phone: "0661 34 56 78", email: "karim.hadj@outlook.com", notes: "Préfère les entraînements le soir" },
    { firstName: "Yasmine", lastName: "Mansouri", phone: "0770 45 67 89", email: "yasmine.m@gmail.com", notes: "Cours collectifs" },
    { firstName: "Sofiane", lastName: "Benali", phone: "0552 56 78 90", email: "sofiane.benali@yahoo.fr", notes: "" },
    { firstName: "Lynda", lastName: "Khelifi", phone: "0662 67 89 01", email: "lynda.khelifi@gmail.com", notes: "Coach personnel demandé" },
    { firstName: "Mehdi", lastName: "Bouzid", phone: "0771 78 90 12", email: "mehdi.b@hotmail.com", notes: "" },
    { firstName: "Fatima Zohra", lastName: "Saidi", phone: "0553 89 01 23", email: "fz.saidi@gmail.com", notes: "" },
    { firstName: "Omar", lastName: "Cherif", phone: "0663 90 12 34", email: "omar.cherif@gmail.com", notes: "" },
    { firstName: "Samia", lastName: "Zerrouki", phone: "0772 01 23 45", email: "samia.z@yahoo.fr", notes: "" },
    { firstName: "Walid", lastName: "Hamdi", phone: "0554 12 34 56", email: "walid.hamdi@gmail.com", notes: "Paiement en crédit (reste 2 000 DA)" },
    { firstName: "Selma", lastName: "Benaissa", phone: "0664 23 45 67", email: "selma.b@outlook.com", notes: "Carnet 10 séances (7 restantes)" },
    { firstName: "Riad", lastName: "Meziane", phone: "0773 34 56 78", email: "riad.meziane@gmail.com", notes: "Créneau Heures Creuses (13h-16h)" },
    { firstName: "Nadia", lastName: "Boussaid", phone: "0555 45 67 89", email: "nadia.b@gmail.com", notes: "Carnet épuisé (0 séance)" },
    // Expiring soon (13, 14)
    { firstName: "Khaled", lastName: "Zitouni", phone: "0774 67 89 01", email: "khaled.z@yahoo.fr", notes: "Rappeler pour renouvellement" },
    { firstName: "Meriem", lastName: "Dahmani", phone: "0556 78 90 12", email: "meriem.d@gmail.com", notes: "" },
    // Expired (15)
    { firstName: "Bilel", lastName: "Taleb", phone: "0557 01 23 45", email: "bilel.taleb@gmail.com", notes: "Abonnement expiré" },
    // Suspended (16)
    { firstName: "Mourad", lastName: "Brahimi", phone: "0558 34 56 78", email: "mourad.b@gmail.com", notes: "Litige vestiaire en cours" },
    // Others
    { firstName: "Anis", lastName: "Ferhat", phone: "0666 89 01 23", email: "anis.ferhat@gmail.com", notes: "" },
    { firstName: "Soraya", lastName: "Larbi", phone: "0775 90 12 34", email: "soraya.l@gmail.com", notes: "" },
    { firstName: "Tarik", lastName: "Slimani", phone: "0665 56 78 90", email: "tarik.s@gmail.com", notes: "" },
    // Blocked card holders (20 to 23)
    { firstName: "Farid", lastName: "Guellil", phone: "0776 23 45 67", email: "farid.g@yahoo.fr", notes: "Badge égaré" },
    { firstName: "Ines", lastName: "Mebarki", phone: "0667 12 34 56", email: "ines.m@gmail.com", notes: "Badge bloqué" },
    { firstName: "Zineb", lastName: "Amrani", phone: "0668 45 67 89", email: "zineb.a@gmail.com", notes: "" },
    { firstName: "Hamza", lastName: "Chikh", phone: "0777 56 78 90", email: "hamza.c@gmail.com", notes: "" },
  ];

  const now = new Date();
  const dayMs = 24 * 60 * 60 * 1000;

  const memberIds: string[] = [];

  for (let i = 0; i < membersData.length; i++) {
    const m = membersData[i];
    const existing = await prisma.member.findFirst({
      where: { firstName: m.firstName, lastName: m.lastName },
    });

    let memberId: string;
    if (existing) {
      memberId = existing.id;
      await prisma.member.update({ where: { id: memberId }, data: { notes: m.notes } });
    } else {
      const created = await prisma.member.create({ data: m });
      memberId = created.id;
    }
    memberIds.push(memberId);

    // Create subscriptions
    const existingSub = await prisma.subscription.findFirst({ where: { memberId } });
    if (!existingSub) {
      if (i < 9) {
        // Active standard
        const planName = i % 2 === 0 ? "Mensuel" : "Trimestriel";
        const duration = i % 2 === 0 ? 30 : 90;
        const startDate = new Date(now.getTime() - 10 * dayMs);
        const endDate = new Date(now.getTime() + (duration - 10) * dayMs);
        await prisma.subscription.create({
          data: {
            memberId,
            planId: createdPlans[planName],
            startDate,
            endDate,
            status: "ACTIVE",
            price: i % 2 === 0 ? 5500 : 14000,
            paidAmount: i % 2 === 0 ? 5500 : 14000,
            balanceDue: 0,
          },
        });
      } else if (i === 9) {
        // Walid Hamdi: Credit / Reste à payer (Formule 5500, acompte 3500, reste 2000)
        await prisma.subscription.create({
          data: {
            memberId,
            planId: createdPlans["Mensuel"],
            startDate: new Date(now.getTime() - 5 * dayMs),
            endDate: new Date(now.getTime() + 25 * dayMs),
            status: "ACTIVE",
            price: 5500,
            paidAmount: 3500,
            balanceDue: 2000,
          },
        });
      } else if (i === 10) {
        // Selma Benaissa: Carnet 10 Séances (7 restantes)
        await prisma.subscription.create({
          data: {
            memberId,
            planId: createdPlans["Carnet 10 Séances"],
            startDate: new Date(now.getTime() - 10 * dayMs),
            endDate: new Date(now.getTime() + 80 * dayMs),
            status: "ACTIVE",
            planType: "SESSIONS",
            totalSessions: 10,
            remainingSessions: 7,
            price: 6000,
            paidAmount: 6000,
            balanceDue: 0,
          },
        });
      } else if (i === 11) {
        // Riad Meziane: Heures Creuses (13h-16h)
        await prisma.subscription.create({
          data: {
            memberId,
            planId: createdPlans["Heures Creuses (13h-16h)"],
            startDate: new Date(now.getTime() - 8 * dayMs),
            endDate: new Date(now.getTime() + 22 * dayMs),
            status: "ACTIVE",
            planType: "TIME_SLOT",
            startTime: "13:00",
            endTime: "16:00",
            price: 3500,
            paidAmount: 3500,
            balanceDue: 0,
          },
        });
      } else if (i === 12) {
        // Nadia Boussaid: Carnet 10 Séances épuisé (0 restante)
        await prisma.subscription.create({
          data: {
            memberId,
            planId: createdPlans["Carnet 10 Séances"],
            startDate: new Date(now.getTime() - 20 * dayMs),
            endDate: new Date(now.getTime() + 70 * dayMs),
            status: "EXPIRED",
            planType: "SESSIONS",
            totalSessions: 10,
            remainingSessions: 0,
            price: 6000,
            paidAmount: 6000,
            balanceDue: 0,
          },
        });
      } else if (i === 13) {
        // Khaled: Expiring soon (2 days left)
        await prisma.subscription.create({
          data: {
            memberId,
            planId: createdPlans["Mensuel"],
            startDate: new Date(now.getTime() - 28 * dayMs),
            endDate: new Date(now.getTime() + 2 * dayMs),
            status: "ACTIVE",
          },
        });
      } else if (i === 14) {
        // Meriem: Expiring soon (5 days left)
        await prisma.subscription.create({
          data: {
            memberId,
            planId: createdPlans["Mensuel"],
            startDate: new Date(now.getTime() - 25 * dayMs),
            endDate: new Date(now.getTime() + 5 * dayMs),
            status: "ACTIVE",
          },
        });
      } else if (i === 15) {
        // Bilel: Expired (10 days ago)
        await prisma.subscription.create({
          data: {
            memberId,
            planId: createdPlans["Mensuel"],
            startDate: new Date(now.getTime() - 40 * dayMs),
            endDate: new Date(now.getTime() - 10 * dayMs),
            status: "EXPIRED",
          },
        });
      } else if (i === 16) {
        // Mourad: Suspended
        await prisma.subscription.create({
          data: {
            memberId,
            planId: createdPlans["Mensuel"],
            startDate: new Date(now.getTime() - 15 * dayMs),
            endDate: new Date(now.getTime() + 15 * dayMs),
            status: "SUSPENDED",
            suspendedAt: new Date(now.getTime() - 2 * dayMs),
          },
        });
      } else if (i < 20) {
        // Active
        await prisma.subscription.create({
          data: {
            memberId,
            planId: createdPlans["Mensuel"],
            startDate: new Date(now.getTime() - 5 * dayMs),
            endDate: new Date(now.getTime() + 25 * dayMs),
            status: "ACTIVE",
          },
        });
      }
    }
  }

  // 5. RFID Cards (exact 30 UIDs)
  const cardUids = [
    // 20 Active cards (assigned to members 0 to 19)
    "04:A3:2B:F1", "04:B4:3C:A2", "04:C5:4D:B3", "04:D6:5E:C4", "04:E7:6F:D5",
    "04:09:81:F7", "04:1A:92:08", "04:3C:B4:2A", "04:4D:C5:3B", "04:6F:E7:5D",
    "04:70:F8:6E", "04:81:09:7F", "04:92:1A:80",
    "04:F8:70:E6", // index 13 -> Khaled (Expiring soon)
    "04:A3:2B:91", // index 14 -> Meriem (Expiring soon)
    "04:2B:A3:19", // index 15 -> Bilel (Expired)
    "04:5E:D6:4C", // index 16 -> Mourad (Suspended)
    "04:B4:3C:92", "04:C5:4D:93", "04:D6:5E:94",
    // 4 Blocked cards (assigned to members 20 to 23)
    "04:EE:11:22", "04:FF:33:44", "04:AA:55:66", "04:BB:77:88",
    // 6 Unassigned stock cards
    "04:00:AA:11", "04:00:BB:22", "04:00:CC:33", "04:00:DD:44", "04:00:EE:55", "04:00:FF:66",
  ];

  for (let i = 0; i < cardUids.length; i++) {
    const uid = cardUids[i];
    let memberId: string | null = null;
    let status: CardStatus = CardStatus.UNASSIGNED;

    if (i < 20) {
      memberId = memberIds[i];
      status = CardStatus.ACTIVE;
    } else if (i >= 20 && i < 24) {
      memberId = memberIds[i];
      status = CardStatus.BLOCKED;
    } else {
      memberId = null;
      status = CardStatus.UNASSIGNED;
    }

    await prisma.card.upsert({
      where: { uid },
      update: { memberId, status },
      create: {
        uid,
        memberId,
        status,
        lastSeenAt: i < 20 ? new Date(now.getTime() - (i + 1) * 3600 * 1000) : null,
      },
    });
  }

  // 6. Payments & Receipt Counter (35 payments)
  const existingPayments = await prisma.payment.count();
  if (existingPayments === 0) {
    const operatorId = createdUsers["reception"] || createdUsers["admin"];
    const planKeys = ["Pass Journée", "Semaine", "Mensuel", "Trimestriel", "Semestriel", "Annuel"];
    const methods: PaymentMethod[] = ["CASH", "CASH", "CARD", "CASH", "OTHER"];

    for (let seq = 1; seq <= 35; seq++) {
      const receiptNumber = `REC-2026-${seq.toString().padStart(4, "0")}`;
      const memberId = memberIds[(seq - 1) % memberIds.length];
      const planName = planKeys[seq % planKeys.length];
      const plan = plansData.find((p) => p.name === planName)!;
      const daysAgo = Math.floor((35 - seq) * 0.8);
      const createdAt = new Date(now.getTime() - daysAgo * dayMs - (seq * 37) * 60 * 1000);

      await prisma.payment.create({
        data: {
          receiptNumber,
          memberId,
          planId: createdPlans[planName],
          planName: plan.name,
          amount: plan.price,
          method: methods[seq % methods.length],
          operatorId,
          createdAt,
        },
      });
    }

    await prisma.counter.upsert({
      where: { key: "receipt-2026" },
      update: { value: 35 },
      create: { key: "receipt-2026", value: 35 },
    });
  }

  // 7. AccessLogs (~400 logs)
  const existingLogs = await prisma.accessLog.count();
  if (existingLogs === 0) {
    console.log("Generating ~400 realistic access logs...");
    const logsToCreate = [];

    for (let day = 0; day < 28; day++) {
      const dayDate = new Date(now.getTime() - day * dayMs);
      const passagesCount = 12 + Math.floor(Math.random() * 8);

      for (let p = 0; p < passagesCount; p++) {
        const rnd = Math.random() * 100;
        let hour = 18;
        if (rnd < 20) hour = 7 + Math.floor(Math.random() * 3);
        else if (rnd < 40) hour = 12 + Math.floor(Math.random() * 3);
        else if (rnd < 85) hour = 17 + Math.floor(Math.random() * 4);
        else hour = 21 + Math.floor(Math.random() * 2);

        const minute = Math.floor(Math.random() * 60);
        const second = Math.floor(Math.random() * 60);
        const logDate = new Date(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate(), hour, minute, second);

        const isRefusal = Math.random() < 0.12;

        if (!isRefusal) {
          const activeCardIndex = Math.floor(Math.random() * 13);
          const uid = cardUids[activeCardIndex];
          const mId = memberIds[activeCardIndex];

          logsToCreate.push({
            cardUid: uid,
            memberId: mId,
            decision: AccessDecision.GRANTED,
            reason: AccessReason.OK,
            kioskName: "BORNE-01",
            source: AccessSource.SIMULATION,
            createdAt: logDate,
          });
        } else {
          logsToCreate.push({
            cardUid: "04:DE:AD:BE:EF",
            memberId: null,
            decision: AccessDecision.DENIED,
            reason: AccessReason.CARD_NOT_FOUND,
            kioskName: "BORNE-01",
            source: AccessSource.SIMULATION,
            createdAt: logDate,
          });
        }
      }
    }

    for (let i = 0; i < logsToCreate.length; i += 100) {
      const chunk = logsToCreate.slice(i, i + 100);
      await prisma.accessLog.createMany({ data: chunk });
    }
  }

  // 8. Alerts
  const existingAlerts = await prisma.alert.count();
  if (existingAlerts === 0) {
    const alertsData = [
      {
        level: AlertLevel.DANGER,
        type: AlertType.BLOCKED_CARD,
        title: "Badge bloqué présenté",
        message: "Un badge bloqué (04:EE:11:22) a été refusé à la borne",
        read: false,
        memberId: memberIds[20],
        cardUid: "04:EE:11:22",
        createdAt: new Date(now.getTime() - 25 * 60 * 1000),
      },
      {
        level: AlertLevel.DANGER,
        type: AlertType.UNKNOWN_CARD,
        title: "Badge inconnu détecté",
        message: "Un badge non répertorié (04:DE:AD:BE:EF) a tenté de passer",
        read: false,
        cardUid: "04:DE:AD:BE:EF",
        createdAt: new Date(now.getTime() - 2 * 3600 * 1000),
      },
      {
        level: AlertLevel.WARNING,
        type: AlertType.EXPIRING_SUBSCRIPTION,
        title: "Échéance dans 2 jours",
        message: "L'abonnement de Khaled Zitouni expire le 12/09/2026",
        read: false,
        memberId: memberIds[13],
        createdAt: new Date(now.getTime() - 4 * 3600 * 1000),
      },
    ];

    for (const a of alertsData) {
      await prisma.alert.create({ data: a });
    }
  }

  // 9. Products for POS (Boissons, Nutrition, Compléments, Accessoires)
  const productsData = [
    { name: "Eau Minérale 0.5L", category: "BOISSONS", price: 50, costPrice: 25, stock: 48, minStockAlert: 10, image: "/products/water.jpg", icon: "💧", barcode: "613000000001" },
    { name: "Eau Minérale 1.5L", category: "BOISSONS", price: 80, costPrice: 40, stock: 36, minStockAlert: 10, image: "/products/water.jpg", icon: "💧", barcode: "613000000002" },
    { name: "Boisson Énergisante (Red Bull)", category: "BOISSONS", price: 250, costPrice: 180, stock: 24, minStockAlert: 5, image: "/products/energy_drink.jpg", icon: "⚡", barcode: "613000000003" },
    { name: "Boisson Isotonique 500ml", category: "BOISSONS", price: 200, costPrice: 130, stock: 18, minStockAlert: 5, image: "/products/isotonic_drink.jpg", icon: "🥤", barcode: "613000000004" },
    { name: "Barre Protéinée Chocolat 50g", category: "PROTEINES", price: 250, costPrice: 160, stock: 30, minStockAlert: 8, image: "/products/protein_bar.jpg", icon: "🍫", barcode: "613000000005" },
    { name: "Barre Protéinée Caramel / Fruits", category: "PROTEINES", price: 250, costPrice: 160, stock: 25, minStockAlert: 8, image: "/products/protein_bar.jpg", icon: "🥜", barcode: "613000000006" },
    { name: "Cookie Protéiné 60g", category: "PROTEINES", price: 300, costPrice: 190, stock: 15, minStockAlert: 5, image: "/products/cookie_protein.jpg", icon: "🍪", barcode: "613000000007" },
    { name: "Shaker Whey Isolate (Dose 30g)", category: "COMPLEMENTS", price: 350, costPrice: 200, stock: 40, minStockAlert: 10, image: "/products/whey_shaker.jpg", icon: "🥛", barcode: "613000000008" },
    { name: "Dose Pre-Workout Booster", category: "COMPLEMENTS", price: 200, costPrice: 110, stock: 30, minStockAlert: 8, image: "/products/preworkout.jpg", icon: "🔥", barcode: "613000000009" },
    { name: "Dose BCAA Énergie", category: "COMPLEMENTS", price: 150, costPrice: 80, stock: 25, minStockAlert: 5, image: "/products/preworkout.jpg", icon: "🍋", barcode: "613000000010" },
    { name: "Serviette Microfibre PASSPro", category: "ACCESSOIRES", price: 500, costPrice: 280, stock: 12, minStockAlert: 3, image: "/products/gym_towel.jpg", icon: "🧘", barcode: "613000000011" },
    { name: "Cadenas à Code Vestiaire", category: "ACCESSOIRES", price: 400, costPrice: 200, stock: 15, minStockAlert: 4, image: "/products/padlock.jpg", icon: "🔒", barcode: "613000000012" },
    { name: "Shaker PASSPro 700ml", category: "ACCESSOIRES", price: 600, costPrice: 320, stock: 10, minStockAlert: 3, image: "/products/whey_shaker.jpg", icon: "🍼", barcode: "613000000013" },
    { name: "Sangles de Tirage Gym", category: "ACCESSOIRES", price: 800, costPrice: 450, stock: 8, minStockAlert: 2, image: "/products/lifting_straps.jpg", icon: "🏋️", barcode: "613000000014" },
  ];

  for (const prod of productsData) {
    const existing = await prisma.product.findFirst({ where: { name: prod.name } });
    if (existing) {
      await prisma.product.update({
        where: { id: existing.id },
        data: prod,
      });
    } else {
      await prisma.product.create({ data: prod });
    }
  }

  console.log("Seeding completed successfully with WAL mode!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
