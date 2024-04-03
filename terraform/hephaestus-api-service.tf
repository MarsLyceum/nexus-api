resource "kubernetes_service" "hephaestus-api-service" {
  metadata {
    name = "hephaestus-api-service"
  }

  spec {
    selector = {
      app = "hephaestus-api"
    }

    port {
      protocol    = "TCP"
      port        = 80
      target_port = 8080
    }

    port {
      protocol    = "TCP"
      port        = 4000
      target_port = 4000
    }


    type = "LoadBalancer"
  }
}
