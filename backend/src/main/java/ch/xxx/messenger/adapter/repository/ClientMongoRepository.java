/**
 *    Copyright 2016 Sven Loesekann

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
 */
package ch.xxx.messenger.adapter.repository;

import java.util.Collection;

import jakarta.validation.Valid;

import org.bson.Document;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;

import com.mongodb.client.result.DeleteResult;
import com.mongodb.reactivestreams.client.MongoCollection;

import ch.xxx.messenger.domain.model.MyMongoRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@Service
public class ClientMongoRepository implements MyMongoRepository {
	private final ReactiveMongoOperations operations;
	
	public ClientMongoRepository(ReactiveMongoOperations operations) {
		this.operations = operations;
	}
	
	@Override
	public <T> Mono<T> save(@Valid T objectToSave) {
		return this.operations.save(objectToSave);
	}
	
	@Override
	public <T> Mono<T> save(Mono<T> monoObjectToSave) {
		return this.operations.save(monoObjectToSave);
	}
	
	@Override
	public <T> Mono<T> findOne(Query query, Class<T> entityClass) {
		return this.operations.findOne(query, entityClass);
	}
	
	@Override
	public <T> Mono<T> findOne(Query query, Class<T> entityClass, String name) {
		return this.operations.findOne(query, entityClass, name);
	}
	
	@Override
	public <T> Flux<T> find(Query query, Class<T> entityClass) {
		return this.operations.find(query, entityClass);
	}
	
	@Override
	public <T> Flux<T> find(Query query, Class<T> entityClass, String collectionName) {
		return this.operations.find(query, entityClass, collectionName);
	}
	
	@Override
	public <T> Flux<T> insertAll(@Valid Collection<? extends T> batchToSave) {
		return this.operations.insertAll(batchToSave);
	}
	
	@Override
	public Mono<Boolean> collectionExists(String collectionName) {
		return this.operations.collectionExists(collectionName);
	}
	
	@Override
	public Mono<MongoCollection<Document>> createCollection(String collectionName) {
		return this.operations.createCollection(collectionName);
	}
	
	@Override
	public Mono<DeleteResult> remove(Object objectToRemove) {
		return this.operations.remove(objectToRemove);
	}
	
	@Override
	public Mono<DeleteResult> remove(Query query, Class<?> entityClass) {
		return this.operations.remove(query, entityClass);
	}
	
	@Override
	public <T> Flux<T> findAllAndRemove(Query query, Class<T> entityClass) {
		return this.operations.findAllAndRemove(query, entityClass);
	}
}
