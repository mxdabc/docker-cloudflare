// _worker.js

// Docker镜像仓库主机地址
let hub_host = 'registry-1.docker.io'
// Docker认证服务器地址
const auth_url = 'https://auth.docker.io'
// 自定义的工作服务器地址
let workers_url = 'https://cf-docker.mirrors.mxdyeah.top'
// 屏蔽爬虫UA
let disallow_spiders = ['netcraft'];

// 根据主机名选择对应的上游地址
function routeByHosts(host) {
		// 定义路由表
	const routes = {
		// 生产环境
		"quay": "quay.io",
		"gcr": "gcr.io",
		"k8s-gcr": "k8s.gcr.io",
		"k8s": "registry.k8s.io",
		"ghcr": "ghcr.io",
		"cloudsmith": "docker.cloudsmith.io",
		
		// 测试环境
		"test": "registry-1.docker.io",
	};

	if (host in routes) return [ routes[host], false ];
	else return [ hub_host, true ];
}

/** @type {RequestInit} */
const PREFLIGHT_INIT = {
	// 预检请求配置
	headers: new Headers({
		'access-control-allow-origin': '*', // 允许所有来源
		'access-control-allow-methods': 'GET,POST,PUT,PATCH,TRACE,DELETE,HEAD,OPTIONS', // 允许的HTTP方法
		'access-control-max-age': '1728000', // 预检请求的缓存时间
	}),
}

/**
 * 构造响应
 * @param {any} body 响应体
 * @param {number} status 响应状态码
 * @param {Object<string, string>} headers 响应头
 */
function makeRes(body, status = 200, headers = {}) {
	headers['access-control-allow-origin'] = '*' // 允许所有来源
	return new Response(body, { status, headers }) // 返回新构造的响应
}

/**
 * 构造新的URL对象
 * @param {string} urlStr URL字符串
 */
function newUrl(urlStr) {
	try {
		return new URL(urlStr) // 尝试构造新的URL对象
	} catch (err) {
		return null // 构造失败返回null
	}
}

function isUUID(uuid) {
	// 定义一个正则表达式来匹配 UUID 格式
	const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[4][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
	
	// 使用正则表达式测试 UUID 字符串
	return uuidRegex.test(uuid);
}

async function nginx() {
	const text = `
	<!DOCTYPE html>
	<html lang="zh-CN">
	 <head> 
	  <meta charset="utf-8" /> 
	  <meta name="viewport" content="width=device-width, initial-scale=1" /> 
	  <link rel="icon" type="image/x-icon" href="https://cdn.picui.cn/vip/2024/06/02/665bddeff07fc.ico" /> 
	  <title>Docker Mirror - Powered by mxd.</title> 
	  <meta name="keywords" content="dockerhub, docker镜像, docker镜像下载, docker mirror, docker hub 访问不了, docker hub代理, docker访问不了, dockerhub访问不了, docker镜像国内代理, docker镜像代理, docker代理, docker-compose" /> 
	  <meta name="description" content="docker.mxdyeah.top是一个科研Docker服务站,用于方便地拉取镜像进行科研工作。" /> 
	  <link rel="stylesheet" href="https://fonts.loli.net/css?family=Comfortaa:300,400,400i,600,600i,700" /> 
	  <style>
		body {
			margin: 0;
			padding: 0;
			background-color: #f4f4f4;
			color: rgb(0, 0, 0);
		}
		
		.header {
			background: linear-gradient(90deg, rgb(28, 144, 237) 0%, rgb(29, 99, 237) 100%);
			color: #fff;
			text-align: center;
			box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
			padding: 20px;
			line-height: 2.5rem;
		}
	
		.container {
			max-width: 800px;
			margin: 40px auto;
			padding: 20px;
			background-color: #fff;
			box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
			border-radius: 10px;
		}
	
		.content {
			margin-bottom: 20px;
		}
	
		.footer {
			text-align: center;
			padding: 20px 0;
			background: linear-gradient(90deg, rgb(28, 144, 237) 0%, rgb(29, 99, 237) 100%);
			color: #fff;
		}
	
		pre {
			/* background-color: #58bcb4; */
			background-color: rgb(28, 144, 237);
			color: #f8f8f2;
			padding: 15px;
			border-radius: 5px;
			overflow-x: auto;
		}
	
		a {
			color: #e9e9e9;
			text-decoration: none;
			display: inline-block;
			position: relative;
			z-index: 1; 
		}
		
		a::before {
		  content: '';
		  position: absolute;
		  bottom: 0;
		  left: 0;
		  width: 100%;
		  height: 60%;
		  background-color: rgb(29, 99, 237, 0.425);
		  z-index: -1;
		  transition: all 0.3s ease;
		}
	
		a:hover {
		  text-decoration: none;
		  color: #fff;
		}
	
		a:hover::before {
		  background-color:  rgb(29, 99, 237, 0.84); 
		}
		
		@media (max-width: 600px) {
			.container {
				margin: 20px;
				padding: 15px;
			}
			.header {
				padding: 15px 0;
			}
		}
	
		h1 {
		  margin: 0px;
		  font-size: 2.5rem;
		  font-weight: 500;
		  letter-spacing: 0px;
		  line-height: 1.143;
		  font-family: Roboto, system-ui, sans-serif;
		}
	
		span {
		  margin: 0px;
		  letter-spacing: 0.02em;
		  line-height: 1.429;
		  color: rgb(255, 255, 255);
		  font-weight: 700;
		  font-size: 1.285rem;
		  text-transform: lowercase;
		  font-family: Comfortaa;
		}
	
	
		/* Modal styles */
		.modal {
		  display: none; 
		  position: fixed; 
		  z-index: 1000; 
		  left: 0;
		  top: 0;
		  width: 100%; 
		  height: 100%; 
		  overflow: auto; 
		  background-color: rgba(0,0,0,0.4); 
		  backdrop-filter: blur(5px);
		}
	
		.modal-content {
		  background-color: #fefefe;
		  margin: 15% auto; 
		  padding: 20px;
		  border: 1px solid #888;
		  width: 80%; 
		}
	
		.modal-header {
		  display: flex;
		  justify-content: space-between;
		  align-items: center;
		}
	
		.modal-header h2 {
		  margin: 0;
		}
	
		.modal-footer {
		  display: flex;
		  justify-content: flex-end;
		  gap: 10px;
		}
	
		.button {
		  padding: 10px 20px;
		  cursor: pointer;
		}
	
		.close-btn {
		  background-color: red;
		  color: white;
		  border: none;
		}
	
		.clear-btn {
		  background-color: green;
		  color: white;
		  border: none;
		}
	
		.tips {
		  text-align:left;
		  border-radius: 5px;
		  overflow-x: auto;
		  color: white;
		  border: none;
		  max-width: 800px;
		  margin: 40px auto;
		  padding: 20px;
		  background-color: rgba(165, 233, 244, 0.456);
		  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
		  border-radius: 10px;
		  line-height: 2.5rem;
		}
		</style> 
	 </head> 
	 <body> 
	  <div class="header"> 
	   <div class="copyright" style="height: 25px;display: flex;align-items: center;justify-content: center;padding-top: 1rem;"> 
		<svg style="height: 100%; width: auto;" xmlns="http://www.w3.org/2000/svg" viewbox="0 0 24 18" fill="white">
		 <path d="M23.763 6.886c-.065-.053-.673-.512-1.954-.512-.32 0-.659.03-1.01.087-.248-1.703-1.651-2.533-1.716-2.57l-.345-.2-.227.328a4.596 4.596 0 0 0-.611 1.433c-.23.972-.09 1.884.403 2.666-.596.331-1.546.418-1.744.42H.752a.753.753 0 0 0-.75.749c-.007 1.456.233 2.864.692 4.07.545 1.43 1.355 2.483 2.409 3.13 1.181.725 3.104 1.14 5.276 1.14 1.016 0 2.03-.092 2.93-.266 1.417-.273 2.705-.742 3.826-1.391a10.497 10.497 0 0 0 2.61-2.14c1.252-1.42 1.998-3.005 2.553-4.408.075.003.148.005.221.005 1.371 0 2.215-.55 2.68-1.01.505-.5.685-.998.704-1.053L24 7.076l-.237-.19Z"></path>
		 <path d="M2.216 8.075h2.119a.186.186 0 0 0 .185-.186V6a.186.186 0 0 0-.185-.186H2.216A.186.186 0 0 0 2.031 6v1.89c0 .103.083.186.185.186Zm2.92 0h2.118a.185.185 0 0 0 .185-.186V6a.185.185 0 0 0-.185-.186H5.136A.185.185 0 0 0 4.95 6v1.89c0 .103.083.186.186.186Zm2.964 0h2.118a.186.186 0 0 0 .185-.186V6a.186.186 0 0 0-.185-.186H8.1A.185.185 0 0 0 7.914 6v1.89c0 .103.083.186.186.186Zm2.928 0h2.119a.185.185 0 0 0 .185-.186V6a.185.185 0 0 0-.185-.186h-2.119a.186.186 0 0 0-.185.186v1.89c0 .103.083.186.185.186Zm-5.892-2.72h2.118a.185.185 0 0 0 .185-.186V3.28a.186.186 0 0 0-.185-.186H5.136a.186.186 0 0 0-.186.186v1.89c0 .103.083.186.186.186Zm2.964 0h2.118a.186.186 0 0 0 .185-.186V3.28a.186.186 0 0 0-.185-.186H8.1a.186.186 0 0 0-.186.186v1.89c0 .103.083.186.186.186Zm2.928 0h2.119a.185.185 0 0 0 .185-.186V3.28a.186.186 0 0 0-.185-.186h-2.119a.186.186 0 0 0-.185.186v1.89c0 .103.083.186.185.186Zm0-2.72h2.119a.186.186 0 0 0 .185-.186V.56a.185.185 0 0 0-.185-.186h-2.119a.186.186 0 0 0-.185.186v1.89c0 .103.083.186.185.186Zm2.955 5.44h2.118a.185.185 0 0 0 .186-.186V6a.185.185 0 0 0-.186-.186h-2.118a.185.185 0 0 0-.185.186v1.89c0 .103.083.186.185.186Z"></path>
		</svg> &nbsp;
		<span>Docker</span>
		<span style="opacity: 0.5;">hub</span> 
	   </div> 
	   <div class="title" style="padding-top: 1rem;">
		<h1>Docker 容器镜像库使用说明</h1> 
	   </div> 
	   <div class="tips">
		1. 本服务是为了加速Docker访问,不存储,严禁违反相关法律
		<br />
		2. 低价美国Cera服务器,老牌运营商,4-4 50Mbps 1T流量现在只需55/月!
		<a href="https://t.me/mxdabc">TG联系我</a> 
		<br /> 
		3. TG Docker交流群组
		<a href="https://t.me/+MVUqygPYMKc2YzNh">点击加入TG群组</a>
		<br /> 
		4. 有问题?请看 
		<a href="https://discuz.mxdyeah.top/mxdyeah_discuz_thread-410-1-1.html">Docker镜像问题反馈</a>
	   </div> 
	  </div> 
	  <div class="container"> 
	   <div class="content"> 
		<p>为了加速镜像拉取，你可以使用以下命令设置 registry mirror:</p> 
		<pre><code>sudo tee /etc/docker/daemon.json &lt;&lt;EOF
	{
		&quot;registry-mirrors&quot;: [&quot;https://docker.mxdyeah.top&quot;]
	}
	EOF
	
	sudo systemctl daemon-reload
	sudo systemctl restart docker</code></pre> 
		<p>Cloudflare 的 Workers用量有限,为避免耗尽你可以手动 pull 镜像然后 re-tag 之后 push 至本地镜像仓库。</p> 
		<hr /> 
		<h2>操作示例（根据实际需要替换对应的镜像）：</h2> 
		<p>1. 拉取镜像</p> 
		<pre><code>docker pull docker.mxdyeah.top/library/alpine:latest</code></pre> 
		<p>2. 重命名镜像</p> 
		<pre><code>docker image tag docker.mxdyeah.top/library/alpine:latest library/alpine:latest</code></pre> 
		<p>3. 删除镜像</p> 
		<pre><code>docker rmi docker.mxdyeah.top/library/alpine:latest</code></pre> 
	   </div> 
	  </div> 
	  <div class="footer"> 
	   <p>Powered by mxd. | Mirrored from Docker Inc. </p> 
	  </div> 
	</body>
	</html>
	`
	return text ;
}

export default {
	async fetch(request, env, ctx) {
		const getReqHeader = (key) => request.headers.get(key); // 获取请求头

		let url = new URL(request.url); // 解析请求URL
		const userAgentHeader = request.headers.get('User-Agent');
		const userAgent = userAgentHeader ? userAgentHeader.toLowerCase() : "null";
		if (env.UA) disallow_spiders = disallow_spiders.concat(await ADD(env.UA));
		workers_url = `https://${url.hostname}`;
		const pathname = url.pathname;
		const hostname = url.searchParams.get('hubhost') || url.hostname; 
		const hostTop = hostname.split('.')[0];// 获取主机名的第一部分
		const checkHost = routeByHosts(hostTop);
		hub_host = checkHost[0]; // 获取上游地址
		const fakePage = checkHost[1];
		console.log(`域名头部: ${hostTop}\n反代地址: ${hub_host}\n伪装首页: ${fakePage}`);
		const isUuid = isUUID(pathname.split('/')[1].split('/')[0]);
		
		if (disallow_spiders.some(fxxk => userAgent.includes(fxxk)) && disallow_spiders.length > 0){
			//首页改成一个nginx伪装页
			return new Response(await nginx(), {
				headers: {
					'Content-Type': 'text/html; charset=UTF-8',
				},
			});
		}
		
		const conditions = [
			isUuid,
			pathname.includes('/_'),
			pathname.includes('/r'),
			pathname.includes('/v2/user'),
			pathname.includes('/v2/orgs'),
			pathname.includes('/v2/_catalog'),
			pathname.includes('/v2/categories'),
			pathname.includes('/v2/feature-flags'),
			pathname.includes('search'),
			pathname.includes('source'),
			pathname === '/',
			pathname === '/favicon.ico',
			pathname === '/auth/profile',
		];

		if (conditions.some(condition => condition) && (fakePage === true || hostTop == 'docker')) {
			if (env.URL302){
				return Response.redirect(env.URL302, 302);
			} else if (env.URL){
				if (env.URL.toLowerCase() == 'nginx'){
					//首页改成一个nginx伪装页
					return new Response(await nginx(), {
						headers: {
							'Content-Type': 'text/html; charset=UTF-8',
						},
					});
				} else return fetch(new Request(env.URL, request));
			}
			
			const newUrl = new URL("https://registry.hub.docker.com" + pathname + url.search);

			// 复制原始请求的标头
			const headers = new Headers(request.headers);

			// 确保 Host 头部被替换为 hub.docker.com
			headers.set('Host', 'registry.hub.docker.com');

			const newRequest = new Request(newUrl, {
					method: request.method,
					headers: headers,
					body: request.method !== 'GET' && request.method !== 'HEAD' ? await request.blob() : null,
					redirect: 'follow'
			});

			return fetch(newRequest);
		}

		// 修改包含 %2F 和 %3A 的请求
		if (!/%2F/.test(url.search) && /%3A/.test(url.toString())) {
			let modifiedUrl = url.toString().replace(/%3A(?=.*?&)/, '%3Alibrary%2F');
			url = new URL(modifiedUrl);
			console.log(`handle_url: ${url}`)
		}

		// 处理token请求
		if (url.pathname.includes('/token')) {
			let token_parameter = {
				headers: {
					'Host': 'auth.docker.io',
					'User-Agent': getReqHeader("User-Agent"),
					'Accept': getReqHeader("Accept"),
					'Accept-Language': getReqHeader("Accept-Language"),
					'Accept-Encoding': getReqHeader("Accept-Encoding"),
					'Connection': 'keep-alive',
					'Cache-Control': 'max-age=0'
				}
			};
			let token_url = auth_url + url.pathname + url.search
			return fetch(new Request(token_url, request), token_parameter)
		}

		// 修改 /v2/ 请求路径
		if (/^\/v2\/[^/]+\/[^/]+\/[^/]+$/.test(url.pathname) && !/^\/v2\/library/.test(url.pathname)) {
			url.pathname = url.pathname.replace(/\/v2\//, '/v2/library/');
			console.log(`modified_url: ${url.pathname}`)
		}

		// 更改请求的主机名
		url.hostname = hub_host;

		// 构造请求参数
		let parameter = {
			headers: {
				'Host': hub_host,
				'User-Agent': getReqHeader("User-Agent"),
				'Accept': getReqHeader("Accept"),
				'Accept-Language': getReqHeader("Accept-Language"),
				'Accept-Encoding': getReqHeader("Accept-Encoding"),
				'Connection': 'keep-alive',
				'Cache-Control': 'max-age=0'
			},
			cacheTtl: 3600 // 缓存时间
		};

		// 添加Authorization头
		if (request.headers.has("Authorization")) {
			parameter.headers.Authorization = getReqHeader("Authorization");
		}

		// 发起请求并处理响应
		let original_response = await fetch(new Request(url, request), parameter)
		let original_response_clone = original_response.clone();
		let original_text = original_response_clone.body;
		let response_headers = original_response.headers;
		let new_response_headers = new Headers(response_headers);
		let status = original_response.status;

		// 修改 Www-Authenticate 头
		if (new_response_headers.get("Www-Authenticate")) {
			let auth = new_response_headers.get("Www-Authenticate");
			let re = new RegExp(auth_url, 'g');
			new_response_headers.set("Www-Authenticate", response_headers.get("Www-Authenticate").replace(re, workers_url));
		}

		// 处理重定向
		if (new_response_headers.get("Location")) {
			return httpHandler(request, new_response_headers.get("Location"))
		}

		// 返回修改后的响应
		let response = new Response(original_text, {
			status,
			headers: new_response_headers
		})
		return response;
	}
};

/**
 * 处理HTTP请求
 * @param {Request} req 请求对象
 * @param {string} pathname 请求路径
 */
function httpHandler(req, pathname) {
	const reqHdrRaw = req.headers

	// 处理预检请求
	if (req.method === 'OPTIONS' &&
		reqHdrRaw.has('access-control-request-headers')
	) {
		return new Response(null, PREFLIGHT_INIT)
	}

	let rawLen = ''

	const reqHdrNew = new Headers(reqHdrRaw)

	const refer = reqHdrNew.get('referer')

	let urlStr = pathname

	const urlObj = newUrl(urlStr)

	/** @type {RequestInit} */
	const reqInit = {
		method: req.method,
		headers: reqHdrNew,
		redirect: 'follow',
		body: req.body
	}
	return proxy(urlObj, reqInit, rawLen)
}

/**
 * 代理请求
 * @param {URL} urlObj URL对象
 * @param {RequestInit} reqInit 请求初始化对象
 * @param {string} rawLen 原始长度
 */
async function proxy(urlObj, reqInit, rawLen) {
	const res = await fetch(urlObj.href, reqInit)
	const resHdrOld = res.headers
	const resHdrNew = new Headers(resHdrOld)

	// 验证长度
	if (rawLen) {
		const newLen = resHdrOld.get('content-length') || ''
		const badLen = (rawLen !== newLen)

		if (badLen) {
			return makeRes(res.body, 400, {
				'--error': `bad len: ${newLen}, except: ${rawLen}`,
				'access-control-expose-headers': '--error',
			})
		}
	}
	const status = res.status
	resHdrNew.set('access-control-expose-headers', '*')
	resHdrNew.set('access-control-allow-origin', '*')
	resHdrNew.set('Cache-Control', 'max-age=1500')

	// 删除不必要的头
	resHdrNew.delete('content-security-policy')
	resHdrNew.delete('content-security-policy-report-only')
	resHdrNew.delete('clear-site-data')

	return new Response(res.body, {
		status,
		headers: resHdrNew
	})
}

async function ADD(envadd) {
	var addtext = envadd.replace(/[	 |"'\r\n]+/g, ',').replace(/,+/g, ',');	// 将空格、双引号、单引号和换行符替换为逗号
	//console.log(addtext);
	if (addtext.charAt(0) == ',') addtext = addtext.slice(1);
	if (addtext.charAt(addtext.length -1) == ',') addtext = addtext.slice(0, addtext.length - 1);
	const add = addtext.split(',');
	//console.log(add);
	return add ;
}
