// Stub do Prisma para builds sem conexão com banco de dados
module.exports = {
  PrismaClient: function PrismaClient() {
    return {
      $connect: () => Promise.resolve(),
      $disconnect: () => Promise.resolve(),
      $transaction: () => Promise.resolve(),
    };
  }
}; 