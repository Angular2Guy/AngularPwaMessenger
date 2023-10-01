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
package ch.xxx.messenger.usecase.service;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;

import ch.xxx.messenger.domain.model.BingoGame;
import ch.xxx.messenger.domain.model.MyMongoRepository;
import reactor.core.publisher.Mono;

@Service
public class BingoService {
	private static final Logger LOG = LoggerFactory.getLogger(BingoService.class);

	private record BingoGameChanged(BingoGame bingoGame, AtomicBoolean changed) {
	}

	private final MyMongoRepository repository;

	public BingoService(MyMongoRepository repository) {
		this.repository = repository;
	}

	public Mono<BingoGame> startBingoGame(BingoGame bingoGame) {
		bingoGame.setUuid(UUID.randomUUID().toString());
		bingoGame.setLastUpdate(LocalDateTime.now());
		bingoGame.getBingoBoards()
				.addAll(bingoGame.getPlayerUserIds().stream()
						.map(myUserId -> new BingoGame.BingoBoard(new int[5][5], new boolean[5][5]))
						.map(myBingoBoard -> this.initBingoBoard(myBingoBoard)).toList());
		return this.repository.save(bingoGame);
	}

	public Mono<BingoGame> updateBingoGame(String uuid) {
		return this.repository.findOne(new Query().addCriteria(Criteria.where("uuid").is(uuid)), BingoGame.class)
				.map(myBingoGame -> this.updateBingoGame(new BingoGameChanged(myBingoGame, new AtomicBoolean(false))))
				.flatMap(myRecord -> myRecord.changed().get() ? this.repository.save(myRecord.bingoGame())
						: Mono.just(myRecord.bingoGame()));
	}

	public Mono<Boolean> checkWin(String gameUuid, String userUuid) {
		return this.repository.findOne(new Query().addCriteria(Criteria.where("uuid").is(gameUuid)), BingoGame.class)
				.flatMap(myBingoGame -> this.checkBoard(myBingoGame, userUuid));
	}

	public void cleanUpGames() {
		LOG.info("Cleanup bingo games started.");
		Date cutoffTimeStamp = Date.from(LocalDateTime.now().minusDays(1L).atZone(ZoneId.systemDefault()).toInstant());		
		this.repository.findAllAndRemove(new Query().addCriteria(Criteria.where("lastUpdate").lt(cutoffTimeStamp)), BingoGame.class).collectList().block();		
		LOG.info("Cleanup bingo games finished.");
	}
	
	private Mono<Boolean> checkBoard(BingoGame bingoGame, String userUuid) {
		boolean result = false;		
		int boardIndex = bingoGame.getPlayerUserIds().indexOf(userUuid);
		if(boardIndex < 0) {
			return Mono.just(false);
		}
		for (int x = 0; x < 5; x++) {
			int columnHits = 0;
			for (int y = 0; y < 5; y++) {
				if(bingoGame.getBingoBoards().get(boardIndex).hits()[x][y]) {
					columnHits += 1;
				}
			}
			if(columnHits > 4) {
				result = true;
			}			
		}
		for (int y = 0; y < 5; y++) {
			int rowHits = 0;
			for (int x = 0; x < 5; x++) {
				if(bingoGame.getBingoBoards().get(boardIndex).hits()[x][y]) {
					rowHits += 1;
				}
			}
			if(rowHits > 4) {
				result = true;
			}			
		}
		int diaHits1 = 0;
		int diaHits2 = 0;
		for(int i = 0;i < 5; i++) {
			if(bingoGame.getBingoBoards().get(boardIndex).hits()[i][i]) {
				diaHits1 += 1;
			}
			if(bingoGame.getBingoBoards().get(boardIndex).hits()[4-i][i]) {
				diaHits2 += 1;
			}
		}
		if(diaHits1 > 4 || diaHits2 > 4) {
			result = true;
		}
		return Mono.just(result);
	}

	private BingoGame.BingoBoard initBingoBoard(BingoGame.BingoBoard bingoBoard) {
		AtomicReference<List<Integer>> atomicList = new AtomicReference<List<Integer>>(new ArrayList<Integer>());
		for (int x = 0; x < 5; x++) {
			for (int y = 0; y < 5; y++) {
				AtomicInteger randVal = new AtomicInteger((int) (Math.round((Math.random() * 74)) + 1));
				while (atomicList.get().stream().anyMatch(myVal -> myVal.equals(randVal.get()))) {
					randVal.set((int) (Math.round((Math.random() * 74)) + 1));
				}
				atomicList.get().add(randVal.get());
				bingoBoard.board()[x][y] = randVal.get();
			}
		}
		return bingoBoard;
	}

	private BingoGameChanged updateBingoGame(BingoGameChanged bingoGameChanged) {
		if (bingoGameChanged.bingoGame().getLastUpdate().isBefore(LocalDateTime.now().minus(15L, ChronoUnit.SECONDS))) {
			AtomicInteger newRand = new AtomicInteger((int) (Math.round((Math.random() * 74)) + 1));
			while (bingoGameChanged.bingoGame.getRandomValues().size() < 73 && bingoGameChanged.bingoGame().getRandomValues().stream()
					.anyMatch(myRandValue -> myRandValue.equals(newRand.get()))) {
				newRand.set((int) (Math.round((Math.random() * 74)) + 1));
			}
			bingoGameChanged.bingoGame().getRandomValues().add(newRand.get());			
			bingoGameChanged.bingoGame().getBingoBoards().forEach(myBingoBoard -> this.updateBingoBoardHits(myBingoBoard, newRand.get()));
			bingoGameChanged.changed().set(true);
		}
		return bingoGameChanged;
	}
	
	private BingoGame.BingoBoard updateBingoBoardHits(BingoGame.BingoBoard bingoBoard, int newRand) {
		for(int x = 0;x < 5; x++) {
			for(int y = 0;y < 5; y++) {				
				if(bingoBoard.board()[x][y] == newRand) {
					bingoBoard.hits()[x][y] = true;
				}
			}
		}
		return bingoBoard;
	}
}
