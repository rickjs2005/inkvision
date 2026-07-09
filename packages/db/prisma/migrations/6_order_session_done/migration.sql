-- Novo status intermediário entre SCHEDULED e COMPLETED: dá ao tatuador uma
-- ação própria ("sessão realizada") independente do pagamento final do
-- cliente. Sem isso, um pedido cujo cliente demore/esqueça de pagar o valor
-- final ficava travado em SCHEDULED para sempre, sem nenhuma ação disponível
-- do lado do estúdio.
ALTER TYPE "OrderStatus" ADD VALUE 'SESSION_DONE';
