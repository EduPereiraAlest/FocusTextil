<h1 align="center"> WebRep v2 - Front-end </h1>

# :bookmark_tabs: About the Project
Uma aplicaçao frontend de captação de vendas de produtos da focus textil.

# :white_check_mark: Prerequisites

- node 14.21.3
- Bower

# :question: How to install and run the project

# Install

1.
```bash
npm -g bower
```

2.
```bash
bower install --allow-root
```

3.
```bash
npm install
```

Obs: Caso em algum dos processos seja solicitado a versão do angularjs, deve selecionar `1`.

# :key: Environment Variables

1. Solicite as variáveis de ambiente.
2. Crie o arquivo `.env.AMBIENTE_QUE_DESEJA` com base no `env.example`.
3. Verifique os ambientes disponíveis nos scripts do `package.json`.

4. and run project to
```bash
npm install dev
```

## Geração de build e start em produção(ou outro ambiente)

```bash
npm run build:production
```

# :rotating_light: Important Considerations

- Caso exista o package-lock.json, certifique-se de excluir ele.
- Certifique-se de que a pasta `bower_components` foi excluida, antes de aplicar os comandos de instalação.
