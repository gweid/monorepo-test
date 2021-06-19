# Monorepo 实践

本文为学习 monorepo 的一些随笔记录。



## 1、Monorepo 与 Multirepo



### 1-1、Multirepo

 ![](/imgs/img1.png)

多包多仓库的管理方式，也是目前常见的管理方式，每个项目都对应单独的一个代码仓库。

**优点：**

- 各个项目自由度高，可自行选择构建工具、依赖管理、单元测试等配套设施
- 各个项目相对一般相对较小

**缺点：**

- 代码复用问题：在维护多个项目时，可能会涉及公共组件、工具函数，或者一些配置可以复用。你可能会想: 
  - 把代码直接 copy 过来：但有个问题是，如果这些代码出现 bug、或者需要做一些调整的时候，就得修改多个项目下的多份，维护成本越来越高
  - 抽取成独立 npm 包：但是当需要修改这个 npm 包的时候，需要经历 **修改-->发布-->重新再项目中安装**
- 项目基建问题：在 MultiRepo 当中，各个项目的工作流是割裂的，因此每个项目需要单独配置开发环境、配置 CI 流程、配置部署发布流程等等，甚至每个项目都有自己单独的一套脚手架工具



### 1-2、Monorepo

 ![](/imgs/img2.png)

多包单仓库的代码管理方式。目前，很多比较著名的项目都是用的 Monorepo 的方式进行管理，比如：Element-plus、Vue3、React、Babel 等

**优点：**

- 统一工作流：由于所有的项目放在一个仓库当中，复用起来非常方便，如果有依赖的代码变动，那么用到这个依赖的项目当中会立马感知到。并且所有的项目都是使用最新的代码，不会产生其它项目版本更新不及时的情况
- 降低项目基建成本：所有项目复用一套标准的工具和规范、构建、CI/CD 等，无需切换开发环境，如果有新的项目接入，也可以直接复用已有的基建流程
- 方便管理：方便版本管理和依赖管理，模块之间的引用、调试都非常方便

**缺点：**

- 体积问题：所有的项目都在一个 repo 下，那么随着项目的增多，整个 repo 的体积会变得越来越大
- 权限问题：Monorepo 模式下的权限是开放的，所有再这个 Monorepo 里面的项目，每个人都有权利查看



### 1-3、总结思考

上面对比了 Monorepo 与 Multirepo 的项目管理方式，那么什么时候适合使用 Monorepo 呢？

在我看来，最适合使用 Monorepo 进行管理的是：

- 一些第三方库，例如上面提到的 React、Babel 等；
- 各个项目中通用的逻辑方法，可以抽离出来，封装成一个个工具库，这些工具库可以使用 Monorepo 进行管理。
- 各个项目中可复用的业务代码功能，可以抽离出一个业务组件库，每个业务组件是一个 package，那么这些组件 package 也可以通过 Monorepo 进行管理



## 2、Monorepo 的实现方案

Monorepo 的项目管理，绝不是仅仅代码放到一起就可以的，还需要考虑项目间依赖分析、依赖安装、构建流程、测试流程、CI 及发布流程等诸多工程环节。

目前，比较底层的方案是：lerna 和 yarn 的 workspaces 特性结合，用 yarn 处理依赖问题，lerna 处理发布问题，但是整个构建、测试、CI 等流程还是需要进行手动配置。

当然，也有一些集成的方案，比如[`nx`](https://nx.dev/latest/react/getting-started/getting-started)、[`rushstack`](https://rushstack.io/)，提供从初始化、开发、构建、测试到部署的全流程能力，有一套比较完整的 Monorepo 基础设施，可以直接拿来进行项目的开发。但这些顶层方案内部各种流程和工具链都已经非常完善了，想要基于这些方案来定制、适配和维护的成本过高



接下来，主要以 leran + yarn workspace 的方式学习 monorepo 的管理方式，这也是目前业界最佳实践。



## 3、Lerna

Lerna 是一个管理多个 npm 模块的工具，是 Babel 自己用来维护自己的 Monorepo 并开源出的一个项目。优化维护多包的工作流，解决多个包互相依赖，且发布需要手动维护多个包的问题。

Lerna 现在已经被很多著名的项目组织使用，如：Babel, React, Vue3, Jest 等 。

一个基本的 Lerna 管理的仓库结构如下：

```js
lerna-repo
├── packages
│   ├── pkgA
│   │   ├── ...
│   │   └── package.json
│   ├── pkgB
│   │   ├── ...
│   │   └── package.json
├── lerna.json
├── package.json
```



### 3-1、安装

推荐进行全局安装，因为后面会经常用到：

```js
npm i lerna -g
```



### 3-2、管理模式

Lerna 有两种管理模式：固定模式和独立模式。



**固定/锁定模式（默认）：**

直接执行 `lerna init` 就是使用的固定模式

固定模式的特点是：通过 `lerna.json` 里的版本进行统一的版本管理。这种模式自动将所有 packages 包版本捆绑在一起，对任何其中一个或者多个packages 进行重大改动都会导致所有 packages 的版本号进行升级。



**独立模式：**

执行命令：`lerna init --independent`

独立模式的特点是：允许使用者对每个 package 单独改变版本号。每次执行 `lerna publish` 的时候，针对所有有更新的 package，会逐个询问需要升级的版本号，基准版本为它自身的 package.json 里面的版本号。这种情况下，`lerna.json` 的版本号不会变化。



### 3-3、初始化

这里使用固定模式进行初始化：

```js
lerna init
```

初始化后的目录结构会是这样的：

```js
lerna-test
├── packages
├── lerna.json
├── package.json
```



初始的 package.json 与 lerna.json 内容：

**package.json**

```js
{
  "name": "root",
  "private": true, // 私有的，不会被发布，是用来管理整个 monorepo 项目的，与要发布到 npm 的解耦
  "devDependencies": {
    "lerna": "^4.0.0"
  }
}
```

**lerna.json**

```js
{
  // 所要管理的包的路径，默认是["packages/*"]
  "packages": [
    "packages/*"
  ],
  // 版本号
  "version": "0.0.0"
}
```



### 3-4、创建 package

创建名为 utils 、tools 的 package，按照`monorepo`的惯例，package 的名称最好命名为 `@<主项目名称>/<子项目名称>`，这样当别人引用你的时候，你的这几个项目都可以在`node_modules`的同一个目录下面，目录名字就是`@<主项目名称>`，所以：

```js
lerna create @meno/utils
lerna create @meno/tools
```

执行完命令之后，会发现 packages 目录下面多了两个包

 ![](/imgs/img3.png)

这里发现，虽然 `@meno/utils` 方式，但是在 packages 下面依然是 utils，但是看 package.json 会发现 `"name": "@meno/utils"`，而且执行 lerna ls 命令，也会发现：

 ![](/imgs/img8.png)



### 3-5、安装依赖

```js
lerna add lodash // 为所有 package 增加 lodash 模块 

lerna add lodash --scope utils // 为 utils 安装 lodash
```



### 3-6、依赖包管理

执行上面命令为为所有 package 安装依赖或者为某个 package 安装依赖，都会在每一个 package 下面的 node_modules 中安装，这不仅增加了包的安装和管理成本，还可能会出现同一个依赖有被多个 package 安装到自己目录下的 node_modules 中，也就导致了每个 package 下都维护 node_modules，很不清爽。

 ![](/imgs/img4.png)

基于这种情况，可以使用 --hoist **将子项目的依赖包都提取到最顶层**

```js
lerna bootstrap --hoist
```

为了省去每次都输入 --hoist 参数的麻烦，可以在 lerna.json 配置：

```js
// lerna.json

{
  "packages": [
    "packages/*"
  ],
  "command": {
    "bootstrap": {
      "hoist": true
    }
  },
  "version": "0.0.0"
}
```

然后执行：

```js
lerna bootstrap
```



最后，对于之前依赖包已经被安装到各个 package 下的情况，只需要清理一下安装的依赖即可：

```js
lerna clean
```

清理之后，会发现每个 package 下的 node_modules 被提到了根目录

 ![](/imgs/img5.png)



配置了 `bootstrap: { hoist: true }` ，在后续，当从 gitlab 等仓库把代码拉下来，直接执行：

```js
lerna bootstrap
```

安装所有的依赖项并连接所有的交叉依赖



### 3-7、发布

```js
lerna publish
```



### 3-8、常用 lerna 命令



#### 3-8-1、lerna list

列出所有包

 ![](/imgs/img8.png)



#### 3-8-2、lerna run

运行所有包里面 package.json 的 script 的指令

```js
lerna run test
```

也可以指定运行某个包里面 package.json 的 script 指令

```js
lerna run test --scope @mono/utils
```



#### 3-8-3、lerna exec

运行所有包里面的任意指令

```js
lerna exec -- npm run test
```

也可以指定运行某个包里面的任意指令

```js
lerna exec -- npm run test --scope @mono/utils
```



#### 3-8-4、lerna link

项目包建立软链，类似 npm link



#### 3-8-5、lerna changed

列出下次进行发版 `lerna publish` 要更新的包，包有改动，说明需要进行更新

 ![](/imgs/img9.png)



#### 3-8-6、lerna diff

查看自上次发布以来的所有包或者指定包的 `git diff` 变化



## 4、Lerna 与 yarn workspace

lerna 与 yarn workspace 其实很多功能都是重复的，但是他们功能侧重点不同。

- yarn 侧重于包管理、依赖管理、处理软链

- lerna 侧重于多包管理和发布

所以，可以将两者的优势结合使用。



### 4-1、yarn workspace

`lerna bootstrap --hoist` 虽然可以将子项目的依赖提升到顶层，但是他的方式比较粗暴：先在每个子项目运行 `npm install`，等所有依赖都安装好后，将他们移动到顶层的 `node_modules`。这会导致一个问题，如果多个子项目依赖同一个第三方库，但是需求的版本不同怎么办？比如多个子项目都依赖 `lodash`，但是他们的版本不完全一样：

```js
// utils
"lodash": "4.17.21"

// commom
"lodash": "4.17.21"

// tools
"lodash": "3.17.21"
```

这种-情况，如果使用 `lerna bootstrap --hoist` 来进行提升，`lerna` 会提升用的最多的版本，也就是 `4.17.21` 到顶层，然后把子项目的 `node_modules` 里面的 `lodash` 都删了。也就是说 `tools` 去访问 `lodash` 的话，也会拿到 `4.17.21` 的版本，这可能会导致`tools` 项目工作不正常

这时候就需要 `yarn workspace`  了，他可以解决前面说的版本不一致的问题，`lerna bootstrap --hoist` 会把所有子项目用的最多的版本移动到顶层，而 `yarn workspace`  会检查每个子项目里面依赖及其版本，如果版本不一样则会留在子项目自己的 `node_modules`里面，只有完全一样的依赖才会提升到顶层。

还是以上面这个 `lodash` 为例，使用 `yarn workspace` 的话，会把 `utils` 和 `commom` 的 `4.17.21` 版本移动到顶层，而 `tools` 项目下会保留自己 `3.17.21` 的 `lodash`，这样每个子项目都可以拿到自己需要的依赖了。



那么该怎么使用在 lerna 中使用 yarn workspace 呢?

基本理念就是：用 yarn 处理依赖问题，lerna 处理发布问题，所以前面两步是不变的

1. lerna init 初始化项目
2. lerna create package 创建子包

后面为包添加依赖时，使用 yarn，并开启 yarn workspace：

- 首先，在顶层 package.json 添加：

  ```js
  {
    "name": "root",
    "private": true,
    "workspaces": [
      "packages/*"
    ],
    "devDependencies": {
      "lerna": "^4.0.0"
    }
  }
  ```

- 接着，在 lerna.json 里面指定 `npmClient` 为 `yarn`，并将 `useWorkspaces` 设置为 `true`

  ```js
  {
    "packages": [
      "packages/*"
    ],
    "npmClient": "yarn",
    "useWorkspaces": true,
    "version": "0.0.0"
  }
  ```

然后执行 yarn install 就可以自动解决依赖和 link 等问题

```js
yarn install # 等价于 lerna bootstrap --npm-client yarn --use-workspaces
```

 ![](/imgs/img6.png)



并且在根 node_modules 中还生成软链接，链向各个子包

![](/imgs/img7.png)



这就意味着，再 utils.js 中，可以：

```js
import tools from '@mono/tools'
```

将 tools 引入，这样就解决了各个子包相互引用问题



### 4-2、yarn 为 menorepo 子包添加依赖

一般分为三种场景：

- 为根项目安装依赖：一般的公用的开发工具都是安装在 root 里，如 typescript，这种方式安装的依赖所有子包都可以访问

  ```js
  yarn add typescript -W -D
  
  -W：必须要，这样才能安装包
  -D：也就是 --save-dev
  ```

  对应的的移除依赖包方式

  ```js
  yarn workspaces remove typescript
  ```

- 给某个 package 安装依赖：

  ```js
  yarn workspace @mono/utils add lodash
  ```

  对应的移除依赖包方法

  ```js
  yarn workspace @mono/utils remove lodash
  ```



## 5、搭建业务组件库

下面进行实践，使用 vue2 + ts + lerna + yarn workspace + storybook 搭建业务组建库



### 5-1、创建基本模板

利用 vue-cli 创建一个基础模板，执行：

```js
vue create component-warehouse
```

选择第三项，自定义模板：

 ![](/imgs/img10.png)

勾选以下选项：

![](/imgs/img11.png)

选择 less

![](/imgs/img12.png)

完成基础模板创建



### 5-2、使用 lerna + yarn workspace

如果 vue create 创建是使用 npm 下载包，可以在生成基础模板之后，删除 package-lock.json 与 node_modules，再执行：

```js
yarn install
```

重新装包



执行：

```ls
lerna init --independent
```

初始化 lerna 环境，因为组件库有很多不同的组件，那么肯定希望对每个 package 单独改变版本号。每次执行 `lerna publish` 的时候，针对所有有更新的 package，会逐个询问需要升级的版本号，基准版本为它自身的 package.json 里面的版本号，所以使用加上

 `--independent`



然后，在顶层 package.json 中：

```js
{
  "name": "root",
  "private": true,
  "workspaces": [
    "packages/*"
  ],
  "devDependencies": {
    "lerna": "^4.0.0"
  }
}
```

在 lerna.json 中：

```js
{
  "packages": [
    "packages/*"
  ],
  "npmClient": "yarn",
  "useWorkspaces": true,
  "version": "0.0.0"
}
```



### 5-3、接入 storybook

安装：

```js
yarn add @storybook/vue -D -W
```



安装 storybook 的辅助 addon

```js
yarn add @storybook/addon-actions @storybook/addon-essentials @storybook/addon-links -D -W
```



`.storybook/main.js`

```js
const path = require('path');

module.exports = {
  "stories": [
    "../doc/**/*.stories.mdx",
    "../doc/**/*.stories.@(js|jsx|ts|tsx)",
    "../packages/**/*.stories.@(js|jsx|ts|tsx|mdx)"
  ],
  "addons": [
    "@storybook/addon-links",
    "@storybook/addon-essentials"
  ],
  webpackFinal: async (config, { configType }) => {
    // Make whatever fine-grained changes you need
    config.module.rules.push({
      test: /\.less$/,
      use: ['style-loader', 'css-loader', 'less-loader'],
      include: path.resolve(__dirname, '../'),
    });
    // Return the altered config
    return config;
  }
}
```

因为在通过 vue-cli 创建项目的时候，就是使用的 less，那么 less 相关的 loader 已经安装，所以这里就可以直接使用









