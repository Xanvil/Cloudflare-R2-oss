# 利用Cloudflare R2 + Workers搭建在线网盘


[汉化修改自/longern/FlareDrive](https://github.com/longern/FlareDrive)

增加了权限系统，支持多管理员，分别授权目录

cloudflare R2是一个文件储存系统，配合Cloudflare Workers可以实现这样一个网盘系统

### 搭建教程


1. fork该仓库
2. 前往Cloudflare R2新建一个R2储存桶，并前往储存桶设置，允许公开访问，复制**公共存储桶 URL**
3. 前往Cloudflare Pages新建一个站点，选择连接到Git

4.选择刚刚fork的仓库，点击开始设置
5.项目名称可以修改，其他项目保持默认不动

6.展开环境变量，添加

| 变量名称 | 值 | 加密 |
| --- | --- | --- |
| PUBURL | 复制的**公共存储桶 URL** | 否 |
| GUEST | `public/` | 否 |
| AUTH_admin | `你的强密码\|*` | **是** |
| AUTH_user1 | `另一密码\|user1/,userPublic/` | **是** |

- **GUEST**：游客允许写入的目录前缀，多个用 `,` 分隔；`*` 表示全部。
- **AUTH_用户名**（如 `AUTH_admin`）：值为 `密码|允许目录`，中间用英文竖线 `|` 分隔（**密码里不要包含 `|`**）。登录时仍填 Basic 认证：用户名 `admin` + 对应密码。
- 含密码的变量在添加时勾选 **Encrypt（加密）**，仅在运行时解密，控制台里不会明文显示。
- 允许目录用 `,` 分隔，**不要在前后加逗号**，否则可能误授全局写入权限。

设置好后点击**开始部署**

7.前往Pages->cloudflare-r2-oss->设置->函数->R2 存储桶绑定,绑定R2存储桶,变量名称`BUCKET`

8.在部署页面重新部署即可
