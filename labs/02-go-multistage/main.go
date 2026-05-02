// Modül 6 - Multi-stage build için basit Go HTTP sunucusu
// Standart kütüphane dışında bağımlılık yok

package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"runtime"
	"time"
)

var startTime = time.Now()

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	mux := http.NewServeMux()

	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		host, _ := os.Hostname()
		fmt.Fprintf(w,
			"Merhaba Docker'dan Go!\n"+
				"Hostname     : %s\n"+
				"Go versiyonu : %s\n"+
				"OS / ARCH    : %s / %s\n"+
				"Uptime       : %s\n",
			host, runtime.Version(), runtime.GOOS, runtime.GOARCH, time.Since(startTime).Round(time.Second))
	})

	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]any{
			"status": "ok",
			"uptime": time.Since(startTime).Seconds(),
		})
	})

	srv := &http.Server{
		Addr:         ":" + port,
		Handler:      mux,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
	}

	log.Printf("Dinleniyor :%s", port)
	if err := srv.ListenAndServe(); err != nil {
		log.Fatal(err)
	}
}
