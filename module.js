// Generated by CoffeeScript 1.9.3
(function() {
  var Crypto, Q, Redis, db, redis;

  Redis = require('ioredis');

  Q = require('q');

  Crypto = require('crypto');

  redis = new Redis();

  db = {
    options: {
      priorities: ["High", "Normal", "Low"],
      priority: {
        "High": "danger",
        "Normal": "primary",
        "Low": "default"
      },
      statuses: ["In Progress", "Closed", "Open"],
      status: {
        "In Progress": "warning",
        "Closed": "default",
        "Open": "success"
      },
      workers: ["Mirko", "Terence", "Joey", "Steven"]
    },
    client: {
      authenticate: function(email, password) {
        "use strict";
        var defer;
        defer = Q.defer();
        redis.get("client:" + email).then(function(uid) {
          if (uid === null) {
            return defer.reject(new Error("Your email cannot be found in our database"));
          }
          return redis.hgetall("client:" + uid).then(function(client) {
            if (client === null) {
              return defer.reject(new Error("We fucked up badly. Contact us. Really"));
            }
            password = Crypto.createHash('sha256').update(password + client.salt).digest('hex');
            client.id = uid;
            if (password === client.password) {
              return defer.resolve(client);
            } else {
              return defer.resolve(null);
            }
          })["catch"](function(error) {
            return defer.reject(error);
          });
        })["catch"](function(error) {
          return defer.reject(error);
        });
        return defer.promise;
      },
      update: function(uid, attributes) {
        "use strict";
        var defer, result, validate;
        result = {};
        defer = Q.defer();
        validate = function() {
          var counter;
          counter = (counter || 0) + 1;
          if (counter === Object.keys(attributes).length) {
            return defer.resolve(result);
          }
        };
        redis.hgetall("client:" + uid).then(function(client) {
          var attribute, results;
          if (client === null) {
            return defer.reject(new Error("Client does not exist"));
          }
          result = client;
          results = [];
          for (attribute in attributes) {
            redis.hset("client:" + uid, attribute, attributes[attribute]);
            result[attribute] = attributes[attribute];
            results.push(validate());
          }
          return results;
        })["catch"](function(error) {
          return defer.reject(error);
        });
        return defer.promise;
      },
      remove: function(uid) {
        "use strict";
        var defer;
        defer = Q.defer();
        redis.hgetall("client:" + uid).then(function(client) {
          if (Object.keys(client).length === 0 || client === null) {
            return defer.reject(new Error("You can't delete what doesn't exist."));
          }
          return redis.del("client:" + uid).then(function(result) {
            return redis.del("client:" + client.email).then(function(result) {
              return redis.srem("clients", uid).then(function(result) {
                return redis.decr("client:count").then(function(result) {
                  return defer.resolve(1);
                });
              })["catch"](function(error) {
                return defer.reject(error);
              });
            })["catch"](function(error) {
              return defer.reject(error);
            })["catch"](function(error) {
              return defer.reject(error);
            });
          })["catch"](function(error) {
            return defer.reject(error);
          });
        })["catch"](function(error) {
          return defer.reject(error);
        });
        return defer.promise;
      },
      create: function(client) {
        "use strict";
        var defer;
        defer = Q.defer();
        redis.get("client:count").then(function(uid) {
          if (uid === null || uid < 0) {
            uid = 0;
            redis.set("client:count", uid);
          }
          return redis.get("client:" + client.email).then(function(email) {
            if (email !== null) {
              return defer.reject(new Error("Email already exists."));
            }
            return redis.hlen("client:" + uid).then(function(hash) {
              if (hash !== 0) {
                return defer.reject(new Error("Hash already exists."));
              }
              client.salt = Crypto.pseudoRandomBytes(20).toString('hex');
              client.password = Crypto.createHash('sha256').update(client.password + client.salt).digest('hex');
              return redis.hmset("client:" + uid, client).then(function(result) {
                return redis.set("client:" + client.email, uid).then(function(result) {
                  return redis.sadd("clients", uid).then(function(result) {
                    return redis.incr("client:count").then(function(result) {
                      return defer.resolve(client);
                    })["catch"](function(error) {
                      return defer.reject(error);
                    });
                  })["catch"](function(error) {
                    return defer.reject(error);
                  });
                })["catch"](function(error) {
                  return defer.reject(error);
                });
              })["catch"](function(error) {
                return defer.reject(error);
              });
            })["catch"](function(error) {
              return defer.reject(error);
            });
          })["catch"](function(error) {
            return defer.reject(error);
          });
        })["catch"](function(error) {
          return defer.reject(error);
        });
        return defer.promise;
      },
      get: function(uid, attribute) {
        "use strict";
        var defer;
        defer = Q.defer();
        redis.hgetall("client:" + uid).then(function(keys) {
          keys.id = uid;
          if (attribute != null) {
            return defer.resolve(keys[attribute]);
          } else {
            return defer.resolve(keys);
          }
        })["catch"](function(error) {
          return defer.reject(error);
        });
        return defer.promise;
      },
      all: function() {
        "use strict";
        var defer;
        defer = Q.defer();
        redis.smembers("clients").then(function(list) {
          return defer.resolve(list);
        })["catch"](function(error) {
          return defer.reject(error);
        });
        return defer.promise;
      }
    },
    ticket: {
      create: function(ticket, uid) {
        "use strict";
        var defer;
        defer = Q.defer();
        redis.get("ticket:count").then(function(tid) {
          if (tid === null || tid < 0) {
            tid = 0;
            redis.set("ticket:count", tid);
          }
          ticket.created = (new Date().toLocaleDateString()) + " " + (new Date().toLocaleTimeString());
          ticket.updated = (new Date().toLocaleDateString()) + " " + (new Date().toLocaleTimeString());
          ticket.status = "Open";
          ticket.assigned = "";
          ticket.client = uid;
          return redis.sadd("client:" + uid + ":ticket", tid).then(function(result) {
            return redis.hmset("ticket:" + tid, ticket).then(function(result) {
              return redis.sadd("tickets", tid).then(function(result) {
                return redis.incr("ticket:count").then(function(result) {
                  return defer.resolve(ticket);
                })["catch"](function(error) {
                  return defer.reject(error);
                });
              })["catch"](function(error) {
                return defer.reject(error);
              });
            })["catch"](function(error) {
              return defer.reject(error);
            });
          })["catch"](function(error) {
            return defer.reject(error);
          });
        })["catch"](function(error) {
          return defer.reject(error);
        });
        return defer.promise;
      },
      remove: function(tid) {
        "use strict";
        var defer;
        defer = Q.defer();
        redis.hgetall("ticket:" + tid).then(function(ticket) {
          if (Object.keys(ticket).length === 0 || ticket === null) {
            return defer.reject(new Error("You can't delete what doesn't exist."));
          }
          return redis.srem("client:" + ticket.client + ":ticket", tid).then(function(result) {
            return redis.srem("tickets", tid).then(function(result) {
              return redis.del("ticket:" + tid).then(function(result) {
                return redis.decr("ticket:count").then(function(result) {
                  return defer.resolve(1);
                })["catch"](function(error) {
                  return defer.reject(error);
                });
              })["catch"](function(error) {
                return defer.reject(error);
              });
            })["catch"](function(error) {
              return defer.reject(error);
            });
          })["catch"](function(error) {
            return defer.reject(error);
          });
        })["catch"](function(error) {
          return defer.reject(error);
        });
        return defer.promise;
      },
      update: function(tid, attributes) {
        "use strict";
        var defer, result, validate;
        result = {};
        defer = Q.defer();
        validate = function() {
          var counter;
          counter = (counter || 0) + 1;
          if (counter === Object.keys(attributes).length) {
            return defer.resolve(result);
          }
        };
        redis.hgetall("ticket:" + tid).then(function(ticket) {
          var attribute, results;
          if (ticket === null) {
            return defer.reject(new Error("Ticket does not exist"));
          }
          result = ticket;
          results = [];
          for (attribute in attributes) {
            redis.hset("ticket:" + tid, attribute, attributes[attribute]);
            result[attribute] = attributes[attribute];
            results.push(validate());
          }
          return results;
        })["catch"](function(error) {
          return defer.reject(error);
        });
        return defer.promise;
      },
      get: function(tid, attribute) {
        "use strict";
        var defer;
        defer = Q.defer();
        redis.hgetall("ticket:" + tid).then(function(keys) {
          keys.id = tid;
          if (attribute != null) {
            return defer.resolve(keys[attribute]);
          } else {
            return defer.resolve(keys);
          }
        })["catch"](function(error) {
          return defer.reject(error);
        });
        return defer.promise;
      },
      all: function() {
        "use strict";
        var defer;
        defer = Q.defer();
        redis.smembers("tickets").then(function(list) {
          return defer.resolve(list);
        })["catch"](function(error) {
          return defer.reject(error);
        });
        return defer.promise;
      }
    },
    comment: {
      from: function(tid) {
        "use strict";
        var defer, result, validate;
        result = [];
        defer = Q.defer();
        validate = function(m) {
          var counter;
          counter = (counter || 0) + 1;
          if (counter === Object.keys(m).length) {
            if (result.length === 0) {
              return defer.resolve([]);
            } else {
              return defer.resolve(result);
            }
          }
        };
        redis.exists("ticket:" + tid).then(function(exists) {
          if (exists === 0) {
            return defer.reject(new Error("Ticket does not exist"));
          }
          return redis.smembers("ticket:" + tid + ":comments").then(function(members) {
            var i, len, member, results;
            results = [];
            for (i = 0, len = members.length; i < len; i++) {
              member = members[i];
              results.push(redis.hgetall("ticket:" + tid + ":comment:" + member).then(function(comment) {
                result.push(comment);
                return validate(members);
              })["catch"](function(error) {
                console.log(error);
                return defer.reject(error);
              }));
            }
            return results;
          })["catch"](function(error) {
            console.log(error);
            return defer.reject(error);
          });
        })["catch"](function(error) {
          console.log(error);
          return defer.reject(error);
        });
        return defer.promise;
      },
      create: function(tid, comment) {
        "use strict";
        var defer;
        defer = Q.defer();
        redis.exists("ticket:" + tid).then(function(exists) {
          if (exists === 0) {
            return defer.reject(new Error("Ticket does not exist"));
          }
          comment.created = (new Date().toLocaleDateString()) + " " + (new Date().toLocaleTimeString());
          return redis.smembers("ticket:" + tid + ":comments").then(function(members) {
            return redis.sadd("ticket:" + tid + ":comments", members.length).then(function(result) {
              comment.id = members.length;
              return redis.hmset("ticket:" + tid + ":comment:" + members.length, comment).then(function(result) {
                return defer.resolve(comment);
              })["catch"](function(error) {
                return defer.reject(error);
              });
            })["catch"](function(error) {
              return defer.reject(error);
            });
          })["catch"](function(error) {
            return defer.reject(error);
          });
        })["catch"](function(error) {
          return defer.reject(error);
        });
        return defer.promise;
      },
      remove: function(tid, cid) {
        "use strict";
        var defer;
        defer = Q.defer();
        redis.exists("ticket:" + tid).then(function(exists) {
          if (exists === 0) {
            return defer.reject(new Error("You can't delete what doesn't exist"));
          }
          return redis.del("ticket:" + tid + ":comment:" + cid).then(function(result) {
            return redis.srem("ticket:" + tid + ":comments", cid).then(function(result) {
              return defer.resolve(1);
            })["catch"](function(error) {
              return defer.reject(error);
            });
          })["catch"](function(error) {
            return defer.reject(error);
          });
        })["catch"](function(error) {
          return defer.reject(error);
        });
        return defer.promise;
      }
    }
  };

  module.exports = db;

}).call(this);
