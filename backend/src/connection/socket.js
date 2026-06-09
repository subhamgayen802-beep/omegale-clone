
const waitingUsers = new Map(); 
const rooms        = new Map(); 

const makeRoomId = () =>
  `room-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const findRoomOf = (socketId) => {
  for (const [roomId, room] of rooms) {
    if (room.user1.socketId === socketId || room.user2.socketId === socketId)
      return roomId;
  }
  return null;
};

const getPartner = (room, socketId) => {
  if (!room) return null;
  return room.user1.socketId === socketId ? room.user2 : room.user1;
};

const closeRoom = (io, roomId) => {
  const room = rooms.get(roomId);
  if (!room) return;
  for (const user of [room.user1, room.user2]) {
    const s = io.sockets.sockets.get(user.socketId);
    if (s) { s.roomId = null; s.leave(roomId); }
  }
  rooms.delete(roomId);
  console.log(`🗑️  Room closed: ${roomId}`);
};

const requeue = (socket, userId) => {
  waitingUsers.set(socket.id, { socketId: socket.id, userId });
  socket.emit("waiting");
  console.log(`⏳ ${socket.id} re-queued (size: ${waitingUsers.size})`);
};


module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log(`🔌 Connected: ${socket.id} (user: ${socket.user?._id ?? "anon"})`);

    socket.on("find-partner", (data) => {
      const userId = data?.userId ?? socket.user?._id;

      if (findRoomOf(socket.id)) {
        console.log(`⚠️  ${socket.id} already in a room — ignoring`);
        return;
      }

      waitingUsers.delete(socket.id);

      if (waitingUsers.size > 0) {
        const [partnerId, partnerEntry] = waitingUsers.entries().next().value;
        waitingUsers.delete(partnerId);

        const partnerSocket = io.sockets.sockets.get(partnerEntry.socketId);

        if (!partnerSocket?.connected) {
          console.log(`⚠️  Queued partner ${partnerId} gone — re-queuing`);
          requeue(socket, userId);
          return;
        }

        const roomId = makeRoomId();
        rooms.set(roomId, {
          user1: partnerEntry,                      
          user2: { socketId: socket.id, userId },  
        });

        socket.roomId        = roomId;
        partnerSocket.roomId = roomId;
        socket.join(roomId);
        partnerSocket.join(roomId);

       
        partnerSocket.emit("partner-found", { roomId, initiator: true });
        socket.emit("partner-found",        { roomId, initiator: false });

        console.log(`✅ Room: ${roomId}  initiator=${partnerEntry.socketId}  responder=${socket.id}`);

      } else {
        requeue(socket, userId);
      }
    });

    const relay = (eventName) => {
      socket.on(eventName, (data) => {
        if (!socket.roomId) return;
        socket.to(socket.roomId).emit(eventName, data);
      });
    };
    relay("offer");
    relay("answer");
    relay("candidate");

    socket.on("next", () => {
      const roomId = socket.roomId;
      if (!roomId) return;

      const room    = rooms.get(roomId);
      const partner = getPartner(room, socket.id);

      if (partner) {
        const partnerSocket = io.sockets.sockets.get(partner.socketId);
        if (partnerSocket?.connected) {
          partnerSocket.emit("partner-left");
          requeue(partnerSocket, partner.userId);
        }
      }

      closeRoom(io, roomId);
      socket.emit("search-again");
    });

    socket.on("disconnect", (reason) => {
      console.log(`❌ Disconnected: ${socket.id} (${reason})`);
      waitingUsers.delete(socket.id);

      const roomId = socket.roomId;
      if (roomId && rooms.has(roomId)) {
        const partner       = getPartner(rooms.get(roomId), socket.id);
        const partnerSocket = partner ? io.sockets.sockets.get(partner.socketId) : null;
        if (partnerSocket?.connected) {
          partnerSocket.emit("partner-left");
          partnerSocket.roomId = null;
        }
        closeRoom(io, roomId);
      }
    });
  });
};