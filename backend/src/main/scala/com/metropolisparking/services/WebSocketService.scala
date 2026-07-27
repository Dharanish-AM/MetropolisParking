package com.metropolisparking.services

import akka.actor.typed.ActorSystem
import akka.http.scaladsl.model.ws.{Message, TextMessage}
import akka.stream.OverflowStrategy
import akka.stream.scaladsl.{BroadcastHub, Keep, Flow, Sink, Source}

class WebSocketService(implicit system: ActorSystem[_]) {
  private val (queue, broadcastSource) = Source.queue[Message](1000, OverflowStrategy.dropHead)
    .toMat(BroadcastHub.sink[Message](bufferSize = 256))(Keep.both)
    .run()

  def broadcast(eventJson: String): Unit = {
    queue.offer(TextMessage(eventJson))
  }

  def websocketFlow(): Flow[Message, Message, Any] = {
    Flow.fromSinkAndSource(Sink.ignore, broadcastSource)
  }
}
