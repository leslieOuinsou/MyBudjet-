import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis;

// Les transactions supprimées (corbeille) restent en base 30 jours : on les masque partout par défaut.
// Pour les lire : passer explicitement `deletedAt` dans le `where` (ex. { deletedAt: { not: null } }).
const live = (where) => (where && Object.prototype.hasOwnProperty.call(where, 'deletedAt') ? where : { ...where, deletedAt: null });
const hideDeleted = async ({ args, query }) => query({ ...args, where: live(args.where) });

const create = () =>
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  }).$extends({
    query: {
      transaction: {
        findMany: hideDeleted,
        findFirst: hideDeleted,
        findFirstOrThrow: hideDeleted,
        count: hideDeleted,
        aggregate: hideDeleted,
        groupBy: hideDeleted,
      },
    },
  });

const prisma = globalForPrisma.prisma ?? create();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
