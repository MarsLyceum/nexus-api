resource "kubernetes_service" "this" {
  metadata {
    name = "hephaestus-api-service"
  }

  spec {
    selector = {
      app = "hephaestus_api"
    }

    port {
      name        = "port-8080"
      protocol    = "TCP"
      port        = 80
      target_port = 8080
    }

    port {
      name        = "port-4000"
      protocol    = "TCP"
      port        = 4000
      target_port = 4000
    }


    type = "LoadBalancer"
  }
}
