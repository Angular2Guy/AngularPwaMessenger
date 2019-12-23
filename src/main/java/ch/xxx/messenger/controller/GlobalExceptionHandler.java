package ch.xxx.messenger.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

@ControllerAdvice
public class GlobalExceptionHandler {
	@ExceptionHandler(Exception.class)
	ResponseEntity<Boolean> defaultExceptionHandler() {
		return new ResponseEntity<Boolean>(Boolean.FALSE,HttpStatus.INTERNAL_SERVER_ERROR);
	}
}
