import http from 'http';
import url from 'url';
import path from 'path';
import fs from 'fs'
import { log } from 'console';
function Express() {
  const app = {
    routes: {
      GET: {},
      POST: {},
      PUT: {},
      DELETE: {}
    },
    middlewares: [],

    get: (path, handler) => {
      app.routes.GET[path] = handler;
    },
    post: (path, handler) => {
      app.routes.POST[path] = handler;
    },
    put: (path, handler) => {
      app.routes.PUT[path] = handler;
    },
    delete: (path, handler) => {
      app.routes.DELETE[path] = handler;
    },
    use: (middleware) => {
      app.middlewares.push(middleware);
    },
    parseBody: (req, callback) => {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk.toString();
      });
      req.on('end', () => {
        try {
          const parsedBody = JSON.parse(body);
          callback(parsedBody);
        } catch (error) {
          callback(null);
        }
      });
    },
    
    handleRequest: (req, res) => {
        
        const { method, url: reqUrl, headers } = req;
        const { pathname, query } = url.parse(reqUrl, true);

        // const routeHandler = app.routes[method][pathname];
        let routeFound = false;
        let routeHandler = null;
        let routeParams = {};
        for (const routePath of Object.keys(app.routes[method])) {
            const routeSegments = routePath.split('/').filter((segment) => segment !== '');
            const pathSegments = pathname.split('/').filter((segment) => segment !== '');
        
            if (routeSegments.length === pathSegments.length) {
              let match = true;
        
              for (let i = 0; i < routeSegments.length; i++) {
                if (routeSegments[i].startsWith(':')) {
                  routeParams[routeSegments[i].slice(1)] = pathSegments[i];
                } else if (routeSegments[i] !== pathSegments[i]) {
                  match = false;
                  break;
                }
              }
        
              if (match) {
                routeFound = true;
                routeHandler = app.routes[method][routePath];
                break;
              }
            }
          }
        if (routeHandler) {
            req.params = routeParams;
            req.query = query;
            req.headers = headers;
      
          // Execute middlewares
          let middlewareIndex = 0;
          const executeMiddleware = () => {
            if (middlewareIndex < app.middlewares.length) {
              const middleware = app.middlewares[middlewareIndex];
              middleware(req, res, () => {
                middlewareIndex++;
                executeMiddleware();
              });
            } else {
              // Extract route parameters
              const pathSegments = pathname.split('/').filter((segment) => segment !== '');
              const routeSegments = Object.keys(app.routes[method]);
      
              for (let i = 0; i < routeSegments.length; i++) {
                const routeSegment = routeSegments[i].split('/').filter((segment) => segment !== '');
      
                if (routeSegment.length === pathSegments.length) {
                  let match = true;
                
                  for (let j = 0; j < routeSegment.length; j++) {
                    if (routeSegment[j].startsWith(':')) {
                      req.params[routeSegment[j].slice(1)] = pathSegments[j];
                    } else if (routeSegment[j] !== pathSegments[j]) {
                      match = false;
                      break;
                    }
                  }
      
                  if (match) {
                    app.parseBody(req, (body) => {

                        req.body = body;
                      res.status = (statusCode) => {
                        res.statusCode = statusCode;
                        return res;
                      };
                      res.json = (data) => {
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify(data));
                      };
                      res.send = (data) => {
                        res.setHeader('Content-Type', 'text/plain');
                        res.end(data);
                      };
                      res.sendFile = (filePath) => {
                        const absolutePath = path.resolve(filePath);
                        fs.readFile(absolutePath, (error, data) => {
                          if (error) {
                            res.statusCode = 500;
                            res.setHeader('Content-Type', 'text/plain');
                            res.end('Internal Server Error');
                          } else {
                            const ext = path.extname(absolutePath).toLowerCase();
                            const contentType = getContentType(ext);
                            res.statusCode = 200;
                            res.setHeader('Content-Type', contentType);
                            res.end(data);
                          }
                        });
                      };
                      routeHandler(req, res);
                    });
                    return;
                  }
                }
              }
      
              res.statusCode = 404;
              res.setHeader('Content-Type', 'text/plain');
              res.end('404 Not Found');
            }
          };
      
          executeMiddleware();
        } 
        else {
          res.statusCode = 404;
          res.setHeader('Content-Type', 'text/plain');
          res.end('404 Not Found');
        }
      },


    listen: (port, callback) => {
      const server = http.createServer(app.handleRequest);
      server.listen(port, callback);
    }
  };

  return app;
}

export default Express;


function getContentType(extension) {
    switch (extension) {
      case '.html':
        return 'text/html';
      case '.css':
        return 'text/css';
      case '.js':
        return 'text/javascript';
      case '.json':
        return 'application/json';
      case '.png':
        return 'image/png';
      case '.jpg':
      case '.jpeg':
        return 'image/jpeg';
      case '.gif':
        return 'image/gif';
      default:
        return 'application/octet-stream';
    }
  }