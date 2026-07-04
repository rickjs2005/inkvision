import {
  // studio
  CompleteOnboardingUseCase,
  CreateStudioUseCase,
  GetStudioBySlugUseCase,
  ListStudiosUseCase,
  RemoveStudioUseCase,
  SetStudioStatusUseCase,
  UpdateStudioUseCase,
  // artist
  AddArtistUseCase,
  UpdateArtistUseCase,
  SetArtistStylesUseCase,
  ListStudioArtistsUseCase,
  GetArtistUseCase,
  ListPublicArtistsUseCase,
  // portfolio
  CreatePortfolioItemUseCase,
  UpdatePortfolioItemUseCase,
  DeletePortfolioItemUseCase,
  ToggleLikeUseCase,
  AddCommentUseCase,
  ListPortfolioUseCase,
  ListCommentsUseCase,
  // order
  CreateOrderUseCase,
  SendQuoteUseCase,
  AcceptQuoteUseCase,
  CancelOrderUseCase,
  GetOrderForClientUseCase,
  ListClientOrdersUseCase,
  ListArtistOrdersUseCase,
  GetOrderForStudioUseCase,
  GetClientOrderDetailUseCase,
  // chat
  OpenClientConversationUseCase,
  OpenStudioConversationUseCase,
  SendClientMessageUseCase,
  SendStudioMessageUseCase,
  MarkReadClientUseCase,
  MarkReadStudioUseCase,
  // payment
  ConnectStudioPaymentsUseCase,
  StartOrderPaymentUseCase,
  ConfirmOrderPaymentUseCase,
  ConfirmPaymentByReferenceUseCase,
  SubscribeStudioUseCase,
  ConfirmSubscriptionUseCase,
  // simulation
  SendDesignUseCase,
  ReviewDesignUseCase,
  RequestSimulationUseCase,
  ProcessSimulationUseCase,
  ApproveSimulationUseCase,
  type SimulationQueue,
  // schedule
  SetAvailabilityUseCase,
  GetAvailabilityUseCase,
  AddTimeOffUseCase,
  ListTimeOffUseCase,
  RemoveTimeOffUseCase,
  GetOrderSlotsUseCase,
  ScheduleSessionUseCase,
  RescheduleSessionUseCase,
  // review
  ReviewOrderUseCase,
  ListArtistReviewsUseCase,
  // admin
  GetPlatformMetricsUseCase,
  ListAuditLogsUseCase,
  ExportMyDataUseCase,
  DeleteMyAccountUseCase,
} from "@inkvision/core";
import { getSimulationProvider } from "@inkvision/ai";
import {
  BullMqSimulationQueue,
  HttpRealtimePublisher,
  MockPaymentGateway,
  MockStorageService,
  StripePaymentGateway,
  PrismaAiUsageRepository,
  PrismaArtistRepository,
  PrismaAuditLogger,
  PrismaChatRepository,
  PrismaDesignRepository,
  PrismaNotificationRepository,
  PrismaOrderRepository,
  PrismaPaymentRepository,
  PrismaPortfolioRepository,
  PrismaAuditReadRepository,
  PrismaLgpdRepository,
  PrismaMetricsRepository,
  PrismaReviewRepository,
  PrismaScheduleRepository,
  PrismaSimulationRepository,
  PrismaStudioRepository,
  PrismaStyleRepository,
  PrismaSubscriptionRepository,
  PrismaUserRepository,
} from "@inkvision/infra";

/**
 * Composition root (camada mais externa da Clean Architecture): instancia os
 * adapters concretos e injeta nos casos de uso. As Server Actions/rotas consomem
 * SÓ os casos de uso — nunca tocam Prisma diretamente.
 */
const studios = new PrismaStudioRepository();
const users = new PrismaUserRepository();
const audit = new PrismaAuditLogger();
const artists = new PrismaArtistRepository();
const portfolio = new PrismaPortfolioRepository();
const styles = new PrismaStyleRepository();
const orders = new PrismaOrderRepository();
const notifications = new PrismaNotificationRepository();
const chat = new PrismaChatRepository();
const payments = new PrismaPaymentRepository();
const subscriptions = new PrismaSubscriptionRepository();
// Stripe real quando a chave está presente; mock no dev.
const gateway = process.env.STRIPE_SECRET_KEY
  ? new StripePaymentGateway()
  : new MockPaymentGateway();
const platformFeePercent = Number(process.env.STRIPE_PLATFORM_FEE_PERCENT ?? 10);
const designs = new PrismaDesignRepository();
const simulations = new PrismaSimulationRepository();
const aiUsage = new PrismaAiUsageRepository();
const realtimePublisher = new HttpRealtimePublisher();
const aiProvider = getSimulationProvider();
const schedule = new PrismaScheduleRepository();
const reviews = new PrismaReviewRepository();
const metrics = new PrismaMetricsRepository();
const auditRead = new PrismaAuditReadRepository();
const lgpd = new PrismaLgpdRepository();

/** Storage mockado no dev (ver R2 na Sprint 2 → prod). Troca por env. */
export const storage = new MockStorageService(process.env.APP_URL ?? "");

const studioDeps = { studios, users, audit };
const artistDeps = { artists, styles, users, studios, subscriptions, audit };
const portfolioDeps = { portfolio, artists, styles, audit };
const orderDeps = { orders, artists, notifications, audit };
const chatDeps = { chat, orders, artists, notifications };
const paymentDeps = { payments, orders, studios, artists, subscriptions, gateway, notifications, audit, platformFeePercent };

/**
 * Fila de simulação in-process (fallback de dev, sem Redis): agenda o
 * processamento para logo após a resposta da action. Em produção, o apps/worker
 * (BullMQ) consome a mesma fila. Reforço = REDIS_URL + BullMQ.
 */
let processSimulationRef: ProcessSimulationUseCase;
const inProcessQueue: SimulationQueue = {
  async enqueue(simulationId: string) {
    setTimeout(() => {
      processSimulationRef.execute(simulationId).catch((e) => console.error("[sim]", e));
    }, 0);
  },
};
// Com REDIS_URL, publica na fila BullMQ (o apps/worker processa, durável e
// escalável). Sem Redis, usa o fallback in-process (setTimeout) do dev.
const simulationQueue = process.env.REDIS_URL ? new BullMqSimulationQueue() : inProcessQueue;
const simulationDeps = {
  orders,
  designs,
  simulations,
  aiUsage,
  queue: simulationQueue,
  provider: aiProvider,
  realtime: realtimePublisher,
  artists,
  notifications,
};
processSimulationRef = new ProcessSimulationUseCase(simulationDeps);

const scheduleDeps = { schedule, orders, artists, notifications, now: () => new Date() };
const reviewDeps = { reviews, orders, artists, notifications };
// Agregador da página de detalhe do pedido (cliente): reúne chat + design +
// simulação + agenda + avaliação num único caso de uso.
const clientOrderDetailDeps = {
  ...chatDeps,
  designs,
  simulations,
  schedule,
  reviews,
  now: () => new Date(),
};

export const useCases = {
  // studio
  createStudio: new CreateStudioUseCase(studioDeps),
  updateStudio: new UpdateStudioUseCase(studioDeps),
  completeOnboarding: new CompleteOnboardingUseCase(studioDeps),
  setStudioStatus: new SetStudioStatusUseCase(studioDeps),
  removeStudio: new RemoveStudioUseCase(studioDeps),
  listStudios: new ListStudiosUseCase(studioDeps),
  getStudioBySlug: new GetStudioBySlugUseCase(studioDeps),
  // artist
  addArtist: new AddArtistUseCase(artistDeps),
  updateArtist: new UpdateArtistUseCase(artistDeps),
  setArtistStyles: new SetArtistStylesUseCase(artistDeps),
  listStudioArtists: new ListStudioArtistsUseCase(artistDeps),
  getArtist: new GetArtistUseCase(artistDeps),
  listPublicArtists: new ListPublicArtistsUseCase(artistDeps),
  // portfolio
  createPortfolioItem: new CreatePortfolioItemUseCase(portfolioDeps),
  updatePortfolioItem: new UpdatePortfolioItemUseCase(portfolioDeps),
  deletePortfolioItem: new DeletePortfolioItemUseCase(portfolioDeps),
  toggleLike: new ToggleLikeUseCase(portfolioDeps),
  addComment: new AddCommentUseCase(portfolioDeps),
  listPortfolio: new ListPortfolioUseCase(portfolioDeps),
  listComments: new ListCommentsUseCase(portfolioDeps),
  // order
  createOrder: new CreateOrderUseCase(orderDeps),
  sendQuote: new SendQuoteUseCase(orderDeps),
  acceptQuote: new AcceptQuoteUseCase(orderDeps),
  cancelOrder: new CancelOrderUseCase(orderDeps),
  getOrderForClient: new GetOrderForClientUseCase(orderDeps),
  listClientOrders: new ListClientOrdersUseCase(orderDeps),
  listArtistOrders: new ListArtistOrdersUseCase(orderDeps),
  getOrderForStudio: new GetOrderForStudioUseCase(orderDeps),
  getClientOrderDetail: new GetClientOrderDetailUseCase(clientOrderDetailDeps),
  // chat
  openClientConversation: new OpenClientConversationUseCase(chatDeps),
  openStudioConversation: new OpenStudioConversationUseCase(chatDeps),
  sendClientMessage: new SendClientMessageUseCase(chatDeps),
  sendStudioMessage: new SendStudioMessageUseCase(chatDeps),
  markReadClient: new MarkReadClientUseCase(chatDeps),
  markReadStudio: new MarkReadStudioUseCase(chatDeps),
  // payment
  connectStudioPayments: new ConnectStudioPaymentsUseCase(paymentDeps),
  startOrderPayment: new StartOrderPaymentUseCase(paymentDeps),
  confirmOrderPayment: new ConfirmOrderPaymentUseCase(paymentDeps),
  confirmPaymentByReference: new ConfirmPaymentByReferenceUseCase(paymentDeps),
  subscribeStudio: new SubscribeStudioUseCase(paymentDeps),
  confirmSubscription: new ConfirmSubscriptionUseCase(paymentDeps),
  // simulation
  sendDesign: new SendDesignUseCase(simulationDeps),
  reviewDesign: new ReviewDesignUseCase(simulationDeps),
  requestSimulation: new RequestSimulationUseCase(simulationDeps),
  processSimulation: processSimulationRef,
  approveSimulation: new ApproveSimulationUseCase(simulationDeps),
  // schedule
  setAvailability: new SetAvailabilityUseCase(scheduleDeps),
  getAvailability: new GetAvailabilityUseCase(scheduleDeps),
  addTimeOff: new AddTimeOffUseCase(scheduleDeps),
  listTimeOff: new ListTimeOffUseCase(scheduleDeps),
  removeTimeOff: new RemoveTimeOffUseCase(scheduleDeps),
  getOrderSlots: new GetOrderSlotsUseCase(scheduleDeps),
  scheduleSession: new ScheduleSessionUseCase(scheduleDeps),
  rescheduleSession: new RescheduleSessionUseCase(scheduleDeps),
  // review
  reviewOrder: new ReviewOrderUseCase(reviewDeps),
  listArtistReviews: new ListArtistReviewsUseCase(reviewDeps),
  // admin + LGPD
  getPlatformMetrics: new GetPlatformMetricsUseCase({ metrics }),
  listAuditLogs: new ListAuditLogsUseCase({ audit: auditRead }),
  exportMyData: new ExportMyDataUseCase({ lgpd }),
  deleteMyAccount: new DeleteMyAccountUseCase({ lgpd }),
} as const;

export const repositories = {
  styles,
  notifications,
  subscriptions,
  designs,
  simulations,
  schedule,
  reviews,
} as const;
