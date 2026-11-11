# Roteiro de apresentação do pitch

Roteiro para apresentar o [AGROAI_Pitch](AGROAI_Pitch.pdf) em cerca de **10 minutos**, com os 16 slides divididos entre os quatro integrantes. A divisão segue os papéis da equipe ágil (slide 12) e pode ser trocada pelo grupo.

| Bloco | Quem apresenta | Slides | Tempo |
|---|---|---|---|
| Abertura, problema e solução | Thiago Braziellas | 1 a 5 | 2 min 30 s |
| Lean Canvas e requisitos | Luiz Claudio | 6 a 8 | 2 min 30 s |
| Caso de uso e diagrama de classes | Arthur Santos | 9 a 11 | 2 min 30 s |
| Equipe, MVP e fechamento | Pedro Ryan | 12 a 16 | 2 min 30 s |

---

## Thiago Braziellas · slides 1 a 5

**1. Abertura.** Apresentar o AGROAI e a equipe. Ler a proposta de valor: "O AGROAI ajuda pequenos e médios produtores rurais a encontrar problemas na lavoura antes que virem prejuízo, por meio de imagens de satélite e IA que mostram onde ir hoje."

**2. Problema.** Contar a dor: a fazenda é grande, falta gente, e a inspeção é feita sem prioridade. Quando a praga ou a falta de água aparece, o prejuízo já aconteceu.

**3. Quem é afetado.** Citar os quatro atores (produtor, encarregado, agrônomo e cooperativa) e fechar no early adopter: o jovem gestor que já usa o celular no campo e quer saber onde ir hoje.

**4. Oportunidade.** O satélite gratuito já passa sobre qualquer fazenda a cada poucos dias. Falta transformar a imagem em decisão para quem não tem equipamento caro.

**5. Solução.** Explicar os quatro passos: satélite, IA, rota do dia e validação em campo. Terminar no diferencial: o app responde a uma pergunta só, "onde eu vou hoje?".

## Luiz Claudio · slides 6 a 8

**6. Lean Canvas.** Começar pela proposta de valor, no bloco verde do meio, e passar pelos outros blocos. Destacar que a receita vem de assinatura por propriedade e que a vantagem injusta é o histórico de campo, que melhora a IA com o uso.

**7. Requisitos funcionais.** Os sete MUST formam o núcleo: sem eles o produtor não chega à rota do dia. Explicar que SHOULD e COULD ficam para depois do MVP.

**8. Requisitos não funcionais.** Mostrar que todos têm número: rota em 3 s no 4G, funcionamento sem sinal, uso sem treinamento e LGPD. Citar que seguem a ISO/IEC 25010.

## Arthur Santos · slides 9 a 11

**9. Diagrama de casos de uso.** Apresentar os atores. O caso central, em verde, é "Consultar a rota do dia". Explicar o «include» (detectar anomalias usa as imagens de satélite) e o «extend» (registrar inspeção a partir da rota).

**10. Especificação do UC06.** Seguir o fluxo principal em seis passos e escolher dois fluxos alternativos para comentar: imagem com nuvens e campo sem internet.

**11. Diagrama de classes.** Ler o caminho principal: o produtor possui a fazenda, que contém talhões; o talhão recebe imagens; a imagem revela anomalias, que entram na rota e são verificadas por uma inspeção.

## Pedro Ryan · slides 12 a 16

**12. Equipe ágil.** Apresentar os papéis e o ritmo: sprints de 2 semanas, daily de 15 min e revisão com um produtor parceiro. Dizer o critério de pronto: a funcionalidade só está pronta quando funciona no celular sem internet.

**13. MVP.** Ler a hipótese: a rota do dia faz o produtor achar problemas antes e andar menos. Mostrar o que entra e o que fica para depois, e a validação com 5 produtores por 30 dias.

**14. Conclusão.** Responder às cinco perguntas em uma frase cada.

**15. Checklist.** Mostrar rapidamente que todos os itens pedidos no roteiro da disciplina foram cobertos e em qual slide estão.

**16. Encerramento.** Ler a frase final ("Saiba onde ir. Proteja sua lavoura. Produza melhor."), agradecer e abrir para perguntas.

---

## Perguntas que a banca pode fazer

| Pergunta | Resposta curta | Quem responde |
|---|---|---|
| E se o satélite pegar nuvem? | O sistema usa a última imagem válida e avisa a data (fluxo A2). | Arthur |
| Como funciona sem internet no campo? | A rota é baixada antes e a inspeção sobe quando o sinal volta (RNF01). | Luiz |
| Como vocês ganham dinheiro? | Assinatura por propriedade monitorada, com plano grátis de 1 talhão; os valores serão validados com os early adopters. | Thiago |
| Como sabem que funciona? | Pelo MVP com 5 produtores durante 30 dias, medindo pontos confirmados e tempo de inspeção. | Pedro |
| E a LGPD? | Só o produtor e quem ele autoriza veem a fazenda, e as tentativas negadas ficam registradas (RNF04). | Luiz |
