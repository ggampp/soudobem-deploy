-- Catálogo inicial (espelha o app de teste)

INSERT INTO companies (id, name, initials, category, seal, score, city, state, description) VALUES
('11111111-1111-1111-1111-111111111101', 'Verde Café Torrefação', 'VC', 'Alimentação', 'Ouro', 94, 'São Paulo', 'SP', 'Cafés especiais de pequenos produtores, comércio justo e relação direta com agricultores familiares.'),
('11111111-1111-1111-1111-111111111102', 'Luz Cosméticos Naturais', 'LC', 'Beleza & Bem-estar', 'Ouro', 91, 'São Paulo', 'SP', 'Cosméticos veganos, cruelty-free, com cadeia de insumos rastreável.'),
('db59fc37-0365-42e8-9dd9-89be8068ca77', 'Farmácia Cuidar+', 'FC', 'Saúde', 'Ouro', 84, 'São Paulo', 'SP', 'Rede farmacêutica com programa de medicamentos sociais.'),
('11111111-1111-1111-1111-111111111103', 'Obra Justa Construções', 'OJ', 'Construção', 'Prata', 82, 'São Paulo', 'SP', 'Construtora com contratos transparentes e obras entregues no prazo.'),
('40e78226-681d-432d-95e0-29eca66a84e9', 'Mercado Bairro Bom', 'MB', 'Alimentação', 'Ouro', 80, 'São Paulo', 'SP', 'Mercado que compra de pequenos produtores da região.'),
('11111111-1111-1111-1111-111111111104', 'Papel do Bem', 'PD', 'Papelaria', 'Prata', 79, 'São Paulo', 'SP', 'Cada caderno vendido financia material escolar para crianças.'),
('1ea68fc2-e159-4734-bc1c-853ab2dcb2d4', 'EducaMais Escola', 'EE', 'Educação', 'Ouro', 78, 'São Paulo', 'SP', 'Escola com bolsas integrais para famílias vulneráveis.'),
('11111111-1111-1111-1111-111111111105', 'Raiz Moda Consciente', 'RM', 'Moda', 'Bronze', 71, 'São Paulo', 'SP', 'Moda em pequenos lotes, com costureiras de cooperativas remuneradas com dignidade.'),
('c97cb559-e0b5-4654-b87b-3ed9aaf92b73', 'Loja Verde Sustentável', 'LV', 'Moda', 'Prata', 70, 'São Paulo', 'SP', 'Moda circular com peças de segunda mão curadas.'),
('75912840-bf20-4b9c-a459-4d6ad2e20c69', 'Café Comunidade', 'CC', 'Alimentação', 'Prata', 66, 'São Paulo', 'SP', 'Cafeteria com espaço aberto para eventos comunitários.'),
('808b8b77-19dd-4304-8f17-e6ffbe21235e', 'Padaria Boa Vizinhança', 'PB', 'Alimentação', 'Prata', 62, 'São Paulo', 'SP', 'Padaria de bairro que doa sobras a instituições locais.'),
('6b73b0cb-ad93-45ae-9071-27200d5c9299', 'Oficina Reciclar', 'OR', 'Construção', 'Bronze', 55, 'São Paulo', 'SP', 'Materiais reaproveitados para pequenas reformas.'),
('8d6a8097-d462-4635-b34e-1fade1bf64e0', 'Studio Movimente', 'SM', 'Beleza & Bem-estar', 'Bronze', 48, 'São Paulo', 'SP', 'Estúdio de yoga que promove aulas gratuitas semanais.');

INSERT INTO benefits (id, title, company_id, type, value_label, cost, featured) VALUES
('b1', 'Doe um kit escolar', '11111111-1111-1111-1111-111111111104', 'Doação', '1 kit para uma criança', 150, FALSE),
('b2', '20% off em toda linha facial', '11111111-1111-1111-1111-111111111102', 'Produto', '20% off', 220, TRUE),
('b3', 'Cashback ampliado na próxima compra', '11111111-1111-1111-1111-111111111105', 'Cashback', '+10% cashback', 300, FALSE),
('b4', 'Kit degustação de cafés especiais', '11111111-1111-1111-1111-111111111101', 'Experiência', 'R$ 120 em produtos', 480, TRUE),
('b5', '1h de consultoria de reforma consciente', '11111111-1111-1111-1111-111111111103', 'Serviço', 'R$ 350 em serviço', 600, FALSE),
('b6', 'Aula experimental de yoga', '8d6a8097-d462-4635-b34e-1fade1bf64e0', 'Experiência', '1 aula avulsa', 80, FALSE);

INSERT INTO influencers (id, name, handle, niche, bio, score, reach, engagement, verified, rising) VALUES
('bc0322b5-d8ee-4be1-a419-57a727871219', 'Marina Silva', '@marinaverde', 'Sustentabilidade', 'Comunica práticas regenerativas e consumo consciente com lastro e dados.', 92, '184.0K', '5.8%', TRUE, FALSE),
('5ecd265d-d462-4c3b-8cc4-ac50cb70495d', 'Júlia Rocha', '@juliarocha', 'Saúde mental', 'Conversas honestas sobre cuidado emocional, terapia e relações.', 90, '221.0K', '6.1%', TRUE, FALSE),
('4d0fb14a-ee69-4ada-8395-b8ae86e43e41', 'Caio Mendes', '@caiocoletivo', 'Economia colaborativa', 'Conecta comunidades, cooperativas e iniciativas de impacto social.', 88, '96.5K', '7.2%', TRUE, FALSE),
('f1bc1c2b-91d8-4f2f-ba1c-a6d5346030dc', 'Lia Nunes', '@lianunes', 'Educação', 'Educadora que traduz ciência e cidadania para o cotidiano das famílias.', 86, '132.4K', '8.4%', TRUE, FALSE),
('1fadff46-9015-479d-b85b-00bbb91e5347', 'Bruno Tavares', '@brunoetica', 'Ética & Tecnologia', 'Discute o impacto humano das decisões de IA, dados e plataformas.', 84, '58.3K', '4.9%', FALSE, TRUE);

INSERT INTO partners (id, name, category, discount, hearts_required, active, address, company_id) VALUES
('p1', 'Farmácia Cuidar+', 'Saúde', '8% em genéricos', 3, TRUE, 'Rua das Flores, 120 — SP', 'db59fc37-0365-42e8-9dd9-89be8068ca77'),
('p2', 'Verde Café Torrefação', 'Alimentação', '10% no balcão', 2, TRUE, 'Al. Santos, 890 — SP', '11111111-1111-1111-1111-111111111101'),
('p3', 'Studio Movimente', 'Bem-estar', '1ª aula grátis', 1, TRUE, 'Rua Augusta, 450 — SP', '8d6a8097-d462-4635-b34e-1fade1bf64e0'),
('p4', 'Raiz Moda Consciente', 'Moda', '15% em peças selecionadas', 5, TRUE, 'Pinheiros — SP', '11111111-1111-1111-1111-111111111105'),
('p5', 'Obra Justa Construções', 'Construção', 'Consultoria inicial sem custo', 8, FALSE, NULL, '11111111-1111-1111-1111-111111111103');

INSERT INTO causes (id, title, description, raised, goal) VALUES
('c1', 'Educação para todos', 'Bolsas e materiais para crianças em situação de vulnerabilidade em escolas públicas.', 32000, 50000),
('c2', 'Alimento que abraça', 'Cestas básicas e refeições quentes distribuídas em comunidades urbanas.', 24500, 30000),
('c3', 'Reflorestar é cuidar', 'Plantio de árvores nativas em áreas degradadas da Mata Atlântica.', 18000, 80000),
('c4', 'Saúde mental acessível', 'Atendimento psicológico gratuito para jovens em risco social.', 9500, 40000);

INSERT INTO community_events (id, title, event_date, location, description, attendees) VALUES
('ev-1', 'Roda de escuta no Café Comunidade', NOW() + INTERVAL '4 days', 'Café Comunidade — SP', 'Encontro presencial de 90 min para praticar escuta ativa em pares.', 18),
('ev-2', 'Workshop online: Feedback do Bem', NOW() + INTERVAL '10 days', 'Online', 'Como dar e receber feedback sem destruir a relação.', 64),
('ev-3', 'Mutirão Fundo do Bem — kits escolares', NOW() + INTERVAL '15 days', 'Zona Leste — SP', 'Montagem e entrega de kits com empresas parceiras.', 41);

INSERT INTO library_items (id, title, kind, minutes, pillar, summary) VALUES
('lib-1', 'Escuta ativa em 6 minutos', 'vídeo', 6, 'empatia', 'Passo a passo para ouvir sem preparar a resposta.'),
('lib-2', 'Mapa de valores pessoais', 'prática', 15, 'autoconhecimento', 'Exercício guiado para listar e priorizar valores.'),
('lib-3', 'Pedidos claros vs. cobranças', 'artigo', 8, 'comunicacao', 'Linguagem que reduz atrito e aumenta cooperação.'),
('lib-4', 'Áudio: 3 minutos de presença', 'áudio', 3, 'autoconhecimento', 'Respiração e ancoragem antes de conversas difíceis.'),
('lib-5', 'Ética no cotidiano digital', 'artigo', 10, 'etica', 'Combinados, prazos e transparência em times remotos.');

INSERT INTO community_posts (author_name, type, title, body, tags, likes, created_at) VALUES
('Mariana S.', 'conquista', '30 dias de escuta ativa', 'Completei um mês praticando 2 minutos de escuta sem interromper. Minha filha notou a diferença.', ARRAY['empatia','família'], 48, NOW() - INTERVAL '5 hours'),
('Rodrigo M.', 'historia', 'Mediação que evitou um processo', 'Dois sócios estavam a um e-mail de romper. Usamos o fluxo de mediação e saímos com 3 combinados claros.', ARRAY['mediação','trabalho'], 72, NOW() - INTERVAL '20 hours'),
('Padaria Aurora', 'projeto', 'Selo Ouro renovado', 'Nossa equipe celebrou a renovação do selo. Clientes voltaram com outra energia — orgulho coletivo.', ARRAY['empresas','selo'], 91, NOW() - INTERVAL '30 hours'),
('IA do Bem', 'dica', 'Micro-hábito da semana', 'Antes de responder uma mensagem difícil, respire 3 vezes e escreva o pedido em uma frase clara.', ARRAY['método','comunicação'], 120, NOW() - INTERVAL '8 hours');
