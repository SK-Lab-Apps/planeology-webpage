/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    /** The App Store campaign token for inline components on the current page. */
    campaign?: string;
  }
}
