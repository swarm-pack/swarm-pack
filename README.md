# swarm-pack
Package management for Docker Swarm

                                                                                       Pack compile


+-----------------------+              +---------------------------+            +--------------------------------+              +--------------------------+                 +---------------------------+
|                       |              |                           |            |                                |              |                          |                 |                           |
|  Input template       |              | Preprocess template       |            | Process template               |              | Post Process template    |                 | Output compiled:          |
|  + docker-compose tpl +--------------+ - Checking variables      +------------+ (interpolate, replace, extend) +--------------+                          +-----------------+ + docker-compose          |
|  | secrets            |              | - Checking structure      |            |                                |              |                          |                 | | secrets                 |
|  | list of variables  |              |                           |            |                                |              |                          |                 | | manifest                |
|                       |              |                           |            |                                |              |                          |                 |                           |
+-----------------------+              +---------------------------+            +--------------------------------+              +--------------------------+                 +---------------------------+





                                                                                      Pack Deploy


+-----------------------+              +-----------------------------------------+                 +---------------------------------------+               +------------------------------------+
|                       |              |                                         |                 |                                       |               |                                    |
| Compiled artifact     |              | Deploy pre-check                        |                 | Perform deploy                        |               | Post deploy                        |
|  + docker-compose     +------------->+ - Connect to cluster                    +---------------->+ - Create secret                       +-------------->+ - Write tracking manifest          |
|  | secrets            |              | | Check if package already installed    |                 | | Deploy pack to designed stack       |               | - Output result                    |
|  | manifest           |              | - Comparing package hash                |                 | | Clear outdated secret               |               |                                    |
|                       |              |                                         |                 |                                       |               |                                    |
+-----------------------+              +-----------------------------------------+                 +---------------------------------------+               +------------------------------------+

