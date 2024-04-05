resource "kubernetes_deployment" "this" {
  depends_on = [
    google_container_cluster.this,
  ]
  provider = kubernetes.gke

  metadata {
    name = "hephaestus-api-deployment-containers"
  }

  spec {
    replicas = 2

    selector {
      match_labels = {
        app = "hephaestus-api"
      }
    }

    template {
      metadata {
        labels = {
          app = "hephaestus-api"
        }
      }

      spec {
        container {
          name  = "hephaestus-api"
          image = "gcr.io/hephaestus-418809/hephaestus-api:latest"

          port {
            container_port = 8080
          }

          port {
            container_port = 4000
          }
        }

        container {
          name  = "cloud-sql-proxy"
          image = "gcr.io/cloudsql-docker/gce-proxy:1.19.1"

          command = [
            "/cloud_sql_proxy",
            "-instances=hephaestus-418809:us-east1-b:hephaestus-postgres=tcp:5432",
            "-credential_file=/secrets/cloudsql/credentials.json"
          ]

          volume_mount {
            name       = "cloudsql-instance-credentials"
            mount_path = "/secrets/cloudsql"
            read_only  = true
          }

          port {
            name           = "port-5432"
            container_port = 5432
          }
        }

        volume {
          name = "cloudsql-instance-credentials"

          secret {
            secret_name = kubernetes_secret.this.metadata[0].name
          }
        }
      }
    }
  }
}
