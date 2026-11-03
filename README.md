# 📐 Engenharia de Requisitos

![Status](https://img.shields.io/badge/Status-Em%20Desenvolvimento-blue)
![License](https://img.shields.io/badge/License-MIT-green)

Este repositório é dedicado à documentação, modelagem e gestão dos artefatos de **Engenharia de Requisitos** da aplicação. Aqui estão centralizados os levantamentos de necessidades, especificações funcionais e não-funcionais, casos de uso, histórias de usuário e matrizes de rastreabilidade do projeto.

---

## 📌 Sumário

- [Visão Geral](#-visão-geral)
- [Estrutura do Repositório](#-estrutura-do-repositório)
- [Classificação de Requisitos](#-classificação-de-requisitos)
- [Técnicas de Elicitação Utilizadas](#-técnicas-de-elicitação-utilizadas)
- [Principais Artefatos](#-principais-artefatos)
- [Ferramentas Utilizadas](#-ferramentas-utilizadas)
- [Como Contribuir](#-como-contribuir)
- [Autor](#-autor)

---

## 🎯 Visão Geral

O objetivo principal deste projeto é garantir a qualidade, consistência e alinhamento entre as expectativas dos *stakeholders* e a implementação técnica por meio de processos bem definidos de Engenharia de Requisitos:

1. **Elicitação e Análise**: Identificação das necessidades e regras de negócio.
2. **Especificação**: Documentação detalhada segundo padrões da indústria (como IEEE 830 / ISO/IEC/IEEE 29148).
3. **Validação**: Homologação dos requisitos com usuários e equipe de desenvolvimento.
4. **Gestão**: Acompanhamento de mudanças e manutenção da rastreabilidade ao longo do ciclo de vida do software.

---

## 📁 Estrutura do Repositório

```text
.
├── docs/
│   ├── srs_especificacao_requisitos.md   # Documento de Especificação de Requisitos (SRS)
│   ├── dicionario_de_dados.md            # Dicionário de termos e entidades
│   └── regras_de_negocio.md              # Regras de negócio do sistema (RNs)
├── use-cases/
│   ├── UC01_cadastrar_usuario.md         # Especificação detalhada de Casos de Uso
│   └── UC02_efetuar_login.md
├── diagrams/
│   ├── caso_de_uso.png                   # Diagramas UML (Casos de Uso, Sequência, etc.)
│   └── fluxo_de_processo.png
├── user-stories/
│   └── historias_de_usuario.md           # Histórias de Usuário (US) e Critérios de Aceite
├── traceability/
│   └── matriz_rastreabilidade.md         # Matriz de Rastreabilidade de Requisitos
└── README.md                             # Documentação principal do repositório
