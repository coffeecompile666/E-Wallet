'use client';

// wrap api to handle error common code
function handleCommonError<T>(promise: Promise<T>): Promise<T> {
  return promise;
}
