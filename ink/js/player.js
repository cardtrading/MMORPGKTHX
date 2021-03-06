var	Player = function(user){
		var self = this;
		self.image = new Image();
		self.image.src = 'img/characters.png';
		
		self.user = user;
		
		self.width = 25;
		self.height = 25;
		self.sprite = 0;
		
		self.speed = 1;
		self.position = {
			path: [],
			at: {
				x:	0,
				y:	0
			}
		};
		
		self.directions = ['S','W','N','E'];
		self.dir = 'S';
		
		self.frames = 2;
		self.actualFrame = 0;
		self.interval = 0;
		
		self.isMoving = false;
		
		self.setPosition = function(x,y){
			if(typeof x === 'object'){
				self.position.at.x = x.x;
				self.position.at.y = x.y;
			}else{
				self.position.at.x = x;
				self.position.at.y = y;
			}
		};
		self.draw = function(){
			draw.easel.screen.drawImage(
				self.image,
				self.width * 2 * self.directions.indexOf(self.dir) + self.width * self.actualFrame * self.isMoving,
				self.sprite * self.height,
				self.width,
				self.height,
				(self === me) ? viewport.center().x : self.position.at.x - viewport.get().x,
				(self === me) ? viewport.center().y : self.position.at.y - viewport.get().y,
				self.width,
				self.height
			);
			if(self.interval === 8){
				self.actualFrame = (self.actualFrame + 1) % self.frames;
				self.interval = 0;
			}
			self.interval++;
		};
		self.move = function(){
			var point,
				speed = self.speed,
				position = self.position,
				check = function(point){
					return position.at.x === point.x && position.at.y === point.y;
				};
			if(position.path[0]){
				point = world.toXY(position.path[0]);
				if(!check(point)){
					self.isMoving = true;
					if(
						speed > 1
					&&(
							Math.abs(point.x - self.position.at.x) === 1
						||	Math.abs(point.y - self.position.at.y) === 1
					)
					){
						speed = 1;
					}
					if(point.x > self.position.at.x){
						self.position.at.x += speed;
						if(self === me){
							viewport.moveBy(speed,0);
						}
						self.dir = 'E';
					}else if(point.x < self.position.at.x){
						self.position.at.x -= speed;
						if(self === me){
							viewport.moveBy(-speed,0);
						}
						self.dir = 'W';
					}else if(point.y > self.position.at.y){
						self.position.at.y += speed;
						if(self === me){
							viewport.moveBy(0,speed);
						}
						self.dir = 'S';
					}else if(point.y < self.position.at.y){
						self.position.at.y -= speed;
						if(self === me){
							viewport.moveBy(0,-speed);
						}
						self.dir = 'N';
					}
					self.setPosition(self.position.at.x,self.position.at.y);
				}else{
					self.isMoving = false;
					if(position.path.length === 1){
						if(self === me){
							$(world).trigger('world.walk:' + position.path[0].x + '.' + position.path[0].y);
						}
						if(position.entity === 'door' || position.entity === 'item'){
							self.dir = self.calculateDir(position.path[0],position.to);
						}
					}
					if(
						self === me
					&&(
						world.collision.onEdge(
							self.position,
							self.dir
						)
						||		position.entity === 'door'
							&&	position.path.length === 1
					)
					){
						var oldPos = {
							dir:	self.dir
						};
						if(position.entity === 'door'){
							oldPos.door = position.door;
							position.door = {};
						}
						socket.emit('player.changeMap',oldPos);
						socket.once('player.changeMap',function(newPos){
							$(world).unbind('world');
							world.render(newPos);
							socket.emit('players.update');
						});
					}
					if(self === me){
						$(world).trigger('world.walk:' + position.path[0].x + '.' + position.path[0].y);
					}
					position.path.shift();
				}
				if(self === me){
					$('.bird').css({
						left:	self.position.at.x,
						top:	self.position.at.y
					});
				}
			}
		};
		self.calculateDir = function(from,to){
			if(typeof from === 'undefined' || typeof to=== 'undefined'){
				from = {};
			}
			if(to.x > from.x){
				return 'E';
			}else if(to.x < from.x){
				return 'W';
			}else if(to.y < from.y){
				return 'N';
			}else if(to.y > from.y){
				return 'S';
			}else{
				return 'S';
			}
		};
		self.inventory = (function(){
			var inventory = [],
				retrieve = function(){
					socket.emit('inventory.get');
					socket.once('inventory.get',function(inv){
						console.log('inventory.get:',inv);
						inventory = inv;
					});
				},
				get = function(){
					return inventory;
				};
			return {
				retrieve:	retrieve,
				get:		get
			};
		})();
	};