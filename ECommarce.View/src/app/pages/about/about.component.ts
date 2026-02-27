import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { RouterModule } from "@angular/router";

import {
  LucideAngularModule,
  ShieldCheck,
  Heart,
  Leaf,
  ArrowLeft,
  ArrowRight,
  Flower2,
} from "lucide-angular";

type CoreValue = {
  title: string;
  icon: any;
  description: string;
};

type ProcessStep = {
  title: string;
  subtitle: string;
  image: string;
  alt: string;
};

@Component({
  selector: "app-about",
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  templateUrl: "./about.component.html",
})
export class AboutComponent {
  readonly icons = {
    ShieldCheck,
    Heart,
    Leaf,
    ArrowLeft,
    ArrowRight,
    Flower2,
  };
  heroEyebrow = "Our Journey";
  heroTitle = "Modesty in Every Stitch";
  heroSubtitle =
    "Bridging the gap between faith-based values and modern fashion trends with elegance, grace, and an unwavering commitment to quality.";

  values: CoreValue[] = [
    {
      title: "Uncompromising Quality",
      icon: ShieldCheck,
      description:
        "We source premium fabrics that stand the test of time, ensuring each garment remains a staple in your wardrobe for years.",
    },
    {
      title: "Modesty First",
      icon: Heart,
      description:
        "Our designs are centered around coverage and comfort, giving you the confidence to move through the world freely.",
    },
    {
      title: "Sustainable Future",
      icon: Leaf,
      description:
        "We are committed to ethical manufacturing processes and reducing our environmental footprint for a better tomorrow.",
    },
  ];

  processSteps: ProcessStep[] = [
    {
      title: "Design Conception",
      subtitle: "Where ideas take shape.",
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuA0iaFqu__M6C-QRroObYQr2tV8ZNYDTYYCoPP4ufX16y91N-DFKA0Hu7txIbCda_Ptb_r3f1GwxZaC9lamsl1ar_hmsaeLvnBpA89gvAYfyYhf6p2AicaHpWw2sK_BGLayWwJm6X5a51APdnnWghzNTFcu0yc7GKD62en2edH7On2bcNG4jxGgo0pB0_YOXaDumAG9BZo9IHY9vlwkcuTrOLpGFYkhukidnGMKx5g5hUwcbZjQJQLb5Gg2OZxClC0ShI832QfvW5E",
      alt: "Designer sketching a new abaya design on paper",
    },
    {
      title: "Material Selection",
      subtitle: "Only the finest threads.",
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuDq8JtaUkNDnucv4e7gy3mfAKTMvhCleCxfHMp7lOu9IdSyUsCMwQEOrLdIZHBM_XGyQRWkpbqBOPHouNmEseZgSQaZB3iqaw2PdRHUVyjxkNph67hE_zKOdcCLaV5SoNE0NR4AmluuzrXPdqKbj6LUwi6TRKZFWfx1WZwX-6TjbcKPHto5PX72GYjadKgUOcgw0BB6RqnABiWLHtoX6T6LAs7CYHa-RvRnG1JYN6G6lyXPNg4C1_Zcc34359aMa3jrh_eoghTHnFg",
      alt: "Close up of hands feeling the texture of a high quality silk fabric",
    },
    {
      title: "Ethical Production",
      subtitle: "Crafted with care and fairness.",
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuBaAbopLnhWcbEQWvusgXKQo2dlNqZqJUW-38jATLSro7Ab0ZVu0nXP0UVsrENg0R2oIerRQjN2kQucjLRBkplMKDDZFdQwS5x5L7D8JloV2WiZeSIsh6v-zmazuD_WRkYWmBWiBmMm6Db21Bwozz90flrtL5XmlvfJ2ZO44XXKcv52pwKhVaaJzaeEZxxK7mwQRsePv1CCQmjnYoeNQKZLk9ANOgJi2pMP75qo3PhS73ANZcg0TDk8WCCQQzXyIcJdpRdtYlOraoU",
      alt: "Seamstress working on a sewing machine in a bright atelier",
    },
    {
      title: "The Final Look",
      subtitle: "Ready for the world.",
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuC1Uspx-t4nBX7f7fEE4iegYTcnhCWeBa52gowuth0aSfM3WnZcQsoVgIIk2zYy-2M23prHrCmMEtqH2DBL3vi1PNppBqdRtfAP9yuLINX9DJEH0WD3Dw9X6kncQdtU2SpIJFSx91fUSDlKw-jnvDs5RkpNTiDIsbI18sVr5n0PJIikhgcGrKbIRESyxd3wzNEKzpDmXgNx88UhzMRJUZWBnAHN_vGbPDn-HbFud3t7eXwf6ktTDzNNyjpXeebprcH5CRtlcARCJBw",
      alt: "Model posing in a studio with professional lighting setup",
    },
  ];
}
