package com.metropolisparking.repositories

import org.jooq.impl.DSL
import org.jooq.{DSLContext, TransactionalRunnable}

class BaseRepository(val dsl: DSLContext) {
  def transaction[T](block: DSLContext => T): T = {
    var result: Option[T] = None
    dsl.transaction(new TransactionalRunnable {
      override def run(configuration: org.jooq.Configuration): Unit = {
        val txDsl = DSL.using(configuration)
        result = Some(block(txDsl))
      }
    })
    result.get
  }
}
