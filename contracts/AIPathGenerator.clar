(define-constant ERR-NOT-AUTHORIZED u100)
(define-constant ERR-INVALID-PATH-ID u101)
(define-constant ERR-INVALID-MODULE-COUNT u102)
(define-constant ERR-INVALID-METADATA u103)
(define-constant ERR-PATH-ALREADY-EXISTS u104)
(define-constant ERR-PATH-NOT-FOUND u105)
(define-constant ERR-INVALID-DIFFICULTY u106)
(define-constant ERR-INVALID-DURATION u107)
(define-constant ERR-INVALID-UPDATE-TIMESTAMP u108)
(define-constant ERR-INVALID-ORACLE u109)
(define-constant ERR-MAX-PATHS-EXCEEDED u110)
(define-constant ERR-INVALID-USER u111)
(define-constant ERR-INVALID-MODULE-ID u112)
(define-constant ERR-INVALID-PATH-STATUS u113)

(define-data-var next-path-id uint u0)
(define-data-var max-paths uint u10000)
(define-data-var oracle-principal (optional principal) none)

(define-map learning-paths
  { user: principal, path-id: uint }
  {
    modules: (list 50 uint),
    metadata: (string-utf8 256),
    difficulty: uint,
    estimated-duration: uint,
    timestamp: uint,
    status: bool
  }
)

(define-map path-updates
  { user: principal, path-id: uint }
  {
    updated-modules: (list 50 uint),
    updated-metadata: (string-utf8 256),
    updated-difficulty: uint,
    updated-duration: uint,
    update-timestamp: uint,
    updater: principal
  }
)

(define-read-only (get-path (user principal) (path-id uint))
  (map-get? learning-paths { user: user, path-id: path-id })
)

(define-read-only (get-path-update (user principal) (path-id uint))
  (map-get? path-updates { user: user, path-id: path-id })
)

(define-read-only (get-path-count)
  (ok (var-get next-path-id))
)

(define-private (validate-modules (modules (list 50 uint)))
  (if (and (> (len modules) u0) (<= (len modules) u50))
      (fold check-module-id modules (ok true))
      (err ERR-INVALID-MODULE-COUNT))
)

(define-private (check-module-id (module-id uint) (acc (response bool uint)))
  (if (> module-id u0)
      acc
      (err ERR-INVALID-MODULE-ID))
)

(define-private (validate-metadata (metadata (string-utf8 256)))
  (if (<= (len metadata) u256)
      (ok true)
      (err ERR-INVALID-METADATA))
)

(define-private (validate-difficulty (difficulty uint))
  (if (and (>= difficulty u1) (<= difficulty u10))
      (ok true)
      (err ERR-INVALID-DIFFICULTY))
)

(define-private (validate-duration (duration uint))
  (if (> duration u0)
      (ok true)
      (err ERR-INVALID-DURATION))
)

(define-private (validate-timestamp (ts uint))
  (if (>= ts block-height)
      (ok true)
      (err ERR-INVALID-UPDATE-TIMESTAMP))
)

(define-private (validate-user (user principal))
  (if (not (is-eq user 'SP000000000000000000002Q6VF78))
      (ok true)
      (err ERR-INVALID-USER))
)

(define-public (set-oracle (oracle principal))
  (begin
    (asserts! (is-eq tx-sender contract-caller) ERR-NOT-AUTHORIZED)
    (asserts! (is-none (var-get oracle-principal)) ERR-INVALID-ORACLE)
    (var-set oracle-principal (some oracle))
    (ok true)
  )
)

(define-public (store-path
  (user principal)
  (modules (list 50 uint))
  (metadata (string-utf8 256))
  (difficulty uint)
  (estimated-duration uint)
)
  (let
    (
      (path-id (var-get next-path-id))
      (current-max (var-get max-paths))
      (oracle (var-get oracle-principal))
    )
    (asserts! (< path-id current-max) ERR-MAX-PATHS-EXCEEDED)
    (asserts! (is-some oracle) ERR-INVALID-ORACLE)
    (asserts! (is-eq tx-sender (unwrap! oracle ERR-INVALID-ORACLE)) ERR-NOT-AUTHORIZED)
    (try! (validate-user user))
    (try! (validate-modules modules))
    (try! (validate-metadata metadata))
    (try! (validate-difficulty difficulty))
    (try! (validate-duration estimated-duration))
    (asserts! (is-none (map-get? learning-paths { user: user, path-id: path-id })) ERR-PATH-ALREADY-EXISTS)
    (map-set learning-paths
      { user: user, path-id: path-id }
      {
        modules: modules,
        metadata: metadata,
        difficulty: difficulty,
        estimated-duration: estimated-duration,
        timestamp: block-height,
        status: true
      }
    )
    (var-set next-path-id (+ path-id u1))
    (print { event: "path-stored", user: user, path-id: path-id })
    (ok path-id)
  )
)

(define-public (update-path
  (user principal)
  (path-id uint)
  (modules (list 50 uint))
  (metadata (string-utf8 256))
  (difficulty uint)
  (estimated-duration uint)
)
  (let
    (
      (path (map-get? learning-paths { user: user, path-id: path-id }))
      (oracle (var-get oracle-principal))
    )
    (asserts! (is-some path) ERR-PATH-NOT-FOUND)
    (asserts! (is-some oracle) ERR-INVALID-ORACLE)
    (asserts! (is-eq tx-sender (unwrap! oracle ERR-INVALID-ORACLE)) ERR-NOT-AUTHORIZED)
    (try! (validate-user user))
    (try! (validate-modules modules))
    (try! (validate-metadata metadata))
    (try! (validate-difficulty difficulty))
    (try! (validate-duration estimated-duration))
    (map-set learning-paths
      { user: user, path-id: path-id }
      {
        modules: modules,
        metadata: metadata,
        difficulty: difficulty,
        estimated-duration: estimated-duration,
        timestamp: block-height,
        status: (get status (unwrap! path ERR-PATH-NOT-FOUND))
      }
    )
    (map-set path-updates
      { user: user, path-id: path-id }
      {
        updated-modules: modules,
        updated-metadata: metadata,
        updated-difficulty: difficulty,
        updated-duration: estimated-duration,
        update-timestamp: block-height,
        updater: tx-sender
      }
    )
    (print { event: "path-updated", user: user, path-id: path-id })
    (ok true)
  )
)

(define-public (deactivate-path (user principal) (path-id uint))
  (let
    (
      (path (map-get? learning-paths { user: user, path-id: path-id }))
      (oracle (var-get oracle-principal))
    )
    (asserts! (is-some path) ERR-PATH-NOT-FOUND)
    (asserts! (is-some oracle) ERR-INVALID-ORACLE)
    (asserts! (is-eq tx-sender (unwrap! oracle ERR-INVALID-ORACLE)) ERR-NOT-AUTHORIZED)
    (map-set learning-paths
      { user: user, path-id: path-id }
      {
        modules: (get modules (unwrap! path ERR-PATH-NOT-FOUND)),
        metadata: (get metadata (unwrap! path ERR-PATH-NOT-FOUND)),
        difficulty: (get difficulty (unwrap! path ERR-PATH-NOT-FOUND)),
        estimated-duration: (get estimated-duration (unwrap! path ERR-PATH-NOT-FOUND)),
        timestamp: (get timestamp (unwrap! path ERR-PATH-NOT-FOUND)),
        status: false
      }
    )
    (print { event: "path-deactivated", user: user, path-id: path-id })
    (ok true)
  )
)