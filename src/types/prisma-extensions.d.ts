import { Prisma } from "@prisma/client";

/**
 * Estende as definições de tipo do Prisma para incluir relações entre modelos
 * que estão presentes no banco de dados.
 */

// Estende o namespace Prisma para adicionar nossas relações
declare global {
  namespace PrismaNamespace {
    interface LeadInclude {
      tags?: boolean | Prisma.ContactTagsArgs;
    }
    
    interface LeadCreateInput {
      tags?: Prisma.ContactTagsCreateNestedManyWithoutLeadsInput;
    }
    
    interface LeadUncheckedCreateInput {
      tags?: Prisma.ContactTagsUncheckedCreateNestedManyWithoutLeadsInput;
    }
    
    interface LeadUpdateInput {
      tags?: Prisma.ContactTagsUpdateManyWithoutLeadsNestedInput;
    }
    
    interface LeadUncheckedUpdateInput {
      tags?: Prisma.ContactTagsUncheckedUpdateManyWithoutLeadsNestedInput;
    }
    
    // Extensões para o modelo ContactTags
    interface ContactTagsInclude {
      leads?: boolean | Prisma.LeadArgs;
    }
    
    interface ContactTagsCreateInput {
      leads?: Prisma.LeadCreateNestedManyWithoutTagsInput;
    }
    
    interface ContactTagsUncheckedCreateInput {
      leads?: Prisma.LeadUncheckedCreateNestedManyWithoutTagsInput;
    }
    
    interface ContactTagsUpdateInput {
      leads?: Prisma.LeadUpdateManyWithoutTagsNestedInput;
    }
    
    interface ContactTagsUncheckedUpdateInput {
      leads?: Prisma.LeadUncheckedUpdateManyWithoutTagsNestedInput;
    }
    
    // Tipos para relacionamentos muitos-para-muitos
    interface ContactTagsCreateNestedManyWithoutLeadsInput {
      create?: Prisma.XOR<Prisma.Enumerable<Prisma.ContactTagsCreateWithoutLeadsInput>, Prisma.Enumerable<Prisma.ContactTagsUncheckedCreateWithoutLeadsInput>>;
      connectOrCreate?: Prisma.Enumerable<Prisma.ContactTagsCreateOrConnectWithoutLeadsInput>;
      connect?: Prisma.Enumerable<Prisma.ContactTagsWhereUniqueInput>;
    }
    
    interface ContactTagsUpdateManyWithoutLeadsNestedInput {
      create?: Prisma.XOR<Prisma.Enumerable<Prisma.ContactTagsCreateWithoutLeadsInput>, Prisma.Enumerable<Prisma.ContactTagsUncheckedCreateWithoutLeadsInput>>;
      connectOrCreate?: Prisma.Enumerable<Prisma.ContactTagsCreateOrConnectWithoutLeadsInput>;
      connect?: Prisma.Enumerable<Prisma.ContactTagsWhereUniqueInput>;
      disconnect?: Prisma.Enumerable<Prisma.ContactTagsWhereUniqueInput>;
      delete?: Prisma.Enumerable<Prisma.ContactTagsWhereUniqueInput>;
      update?: Prisma.Enumerable<Prisma.ContactTagsUpdateWithWhereUniqueWithoutLeadsInput>;
      updateMany?: Prisma.Enumerable<Prisma.ContactTagsUpdateManyWithWhereWithoutLeadsInput>;
      deleteMany?: Prisma.Enumerable<Prisma.ContactTagsScalarWhereInput>;
      set?: Prisma.Enumerable<Prisma.ContactTagsWhereUniqueInput>;
    }
    
    interface LeadCreateNestedManyWithoutTagsInput {
      create?: Prisma.XOR<Prisma.Enumerable<Prisma.LeadCreateWithoutTagsInput>, Prisma.Enumerable<Prisma.LeadUncheckedCreateWithoutTagsInput>>;
      connectOrCreate?: Prisma.Enumerable<Prisma.LeadCreateOrConnectWithoutTagsInput>;
      connect?: Prisma.Enumerable<Prisma.LeadWhereUniqueInput>;
    }
    
    interface LeadUpdateManyWithoutTagsNestedInput {
      create?: Prisma.XOR<Prisma.Enumerable<Prisma.LeadCreateWithoutTagsInput>, Prisma.Enumerable<Prisma.LeadUncheckedCreateWithoutTagsInput>>;
      connectOrCreate?: Prisma.Enumerable<Prisma.LeadCreateOrConnectWithoutTagsInput>;
      connect?: Prisma.Enumerable<Prisma.LeadWhereUniqueInput>;
      disconnect?: Prisma.Enumerable<Prisma.LeadWhereUniqueInput>;
      delete?: Prisma.Enumerable<Prisma.LeadWhereUniqueInput>;
      update?: Prisma.Enumerable<Prisma.LeadUpdateWithWhereUniqueWithoutTagsInput>;
      updateMany?: Prisma.Enumerable<Prisma.LeadUpdateManyWithWhereWithoutTagsInput>;
      deleteMany?: Prisma.Enumerable<Prisma.LeadScalarWhereInput>;
      set?: Prisma.Enumerable<Prisma.LeadWhereUniqueInput>;
    }
    
    // Tipos adicionais necessários para os relacionamentos
    interface ContactTagsCreateWithoutLeadsInput {}
    interface ContactTagsUncheckedCreateWithoutLeadsInput {}
    interface ContactTagsCreateOrConnectWithoutLeadsInput {}
    interface ContactTagsUpdateWithWhereUniqueWithoutLeadsInput {}
    interface ContactTagsUpdateManyWithWhereWithoutLeadsInput {}
    interface ContactTagsScalarWhereInput {}
    
    interface LeadCreateWithoutTagsInput {}
    interface LeadUncheckedCreateWithoutTagsInput {}
    interface LeadCreateOrConnectWithoutTagsInput {}
    interface LeadUpdateWithWhereUniqueWithoutTagsInput {}
    interface LeadUpdateManyWithWhereWithoutTagsInput {}
    interface LeadScalarWhereInput {}
  }
}

// Sobrescreve as definições do Prisma com nossas extensões
declare module "@prisma/client" {
  namespace Prisma {
    // Re-exporta as interfaces estendidas
    export interface LeadInclude extends PrismaNamespace.LeadInclude {}
    export interface LeadCreateInput extends PrismaNamespace.LeadCreateInput {}
    export interface LeadUncheckedCreateInput extends PrismaNamespace.LeadUncheckedCreateInput {}
    export interface LeadUpdateInput extends PrismaNamespace.LeadUpdateInput {}
    export interface LeadUncheckedUpdateInput extends PrismaNamespace.LeadUncheckedUpdateInput {}
    
    export interface ContactTagsInclude extends PrismaNamespace.ContactTagsInclude {}
    export interface ContactTagsCreateInput extends PrismaNamespace.ContactTagsCreateInput {}
    export interface ContactTagsUncheckedCreateInput extends PrismaNamespace.ContactTagsUncheckedCreateInput {}
    export interface ContactTagsUpdateInput extends PrismaNamespace.ContactTagsUpdateInput {}
    export interface ContactTagsUncheckedUpdateInput extends PrismaNamespace.ContactTagsUncheckedUpdateInput {}
    
    // Re-exporta os tipos para relacionamentos
    export interface ContactTagsCreateNestedManyWithoutLeadsInput extends PrismaNamespace.ContactTagsCreateNestedManyWithoutLeadsInput {}
    export interface ContactTagsUpdateManyWithoutLeadsNestedInput extends PrismaNamespace.ContactTagsUpdateManyWithoutLeadsNestedInput {}
    export interface LeadCreateNestedManyWithoutTagsInput extends PrismaNamespace.LeadCreateNestedManyWithoutTagsInput {}
    export interface LeadUpdateManyWithoutTagsNestedInput extends PrismaNamespace.LeadUpdateManyWithoutTagsNestedInput {}
    
    // Re-exporta os tipos adicionais
    export interface ContactTagsCreateWithoutLeadsInput extends PrismaNamespace.ContactTagsCreateWithoutLeadsInput {}
    export interface ContactTagsUncheckedCreateWithoutLeadsInput extends PrismaNamespace.ContactTagsUncheckedCreateWithoutLeadsInput {}
    export interface ContactTagsCreateOrConnectWithoutLeadsInput extends PrismaNamespace.ContactTagsCreateOrConnectWithoutLeadsInput {}
    export interface ContactTagsUpdateWithWhereUniqueWithoutLeadsInput extends PrismaNamespace.ContactTagsUpdateWithWhereUniqueWithoutLeadsInput {}
    export interface ContactTagsUpdateManyWithWhereWithoutLeadsInput extends PrismaNamespace.ContactTagsUpdateManyWithWhereWithoutLeadsInput {}
    export interface ContactTagsScalarWhereInput extends PrismaNamespace.ContactTagsScalarWhereInput {}
    
    export interface LeadCreateWithoutTagsInput extends PrismaNamespace.LeadCreateWithoutTagsInput {}
    export interface LeadUncheckedCreateWithoutTagsInput extends PrismaNamespace.LeadUncheckedCreateWithoutTagsInput {}
    export interface LeadCreateOrConnectWithoutTagsInput extends PrismaNamespace.LeadCreateOrConnectWithoutTagsInput {}
    export interface LeadUpdateWithWhereUniqueWithoutTagsInput extends PrismaNamespace.LeadUpdateWithWhereUniqueWithoutTagsInput {}
    export interface LeadUpdateManyWithWhereWithoutTagsInput extends PrismaNamespace.LeadUpdateManyWithWhereWithoutTagsInput {}
    export interface LeadScalarWhereInput extends PrismaNamespace.LeadScalarWhereInput {}
  }
}

// Precisamos exportar algo para o TypeScript tratar isto como módulo
export {}; 