package main

import (
	"net/http"
)

type endpointInfo struct {
	Path        string
	Name        string
	Description string
}

type registrable interface {
	generateMetadata(endpointInfo endpointInfo, r registrationApp) []byte
	setCredentials(request *http.Request) *http.Request
}
