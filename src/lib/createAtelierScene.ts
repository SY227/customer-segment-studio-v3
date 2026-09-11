import type * as Three from "three";

type ThreeModule = typeof import("three");
interface ActorView {
  segment: { key: string; accent: string; characterHeight: number };
  group: Three.Object3D;
}

/**
 * Optional presentation layer only: architecture, floor engraving, contact shadows,
 * selected-character halo and very light atmosphere. No new character asset,
 * collision rule, metric, segment assignment or analysis state lives here.
 * Every added object is excluded from the original character raycast list.
 */
export function createAtelierScene(T: ThreeModule, scene: Three.Scene) {
  const group = new T.Group();
  group.name = "AtelierDecorativeLayer";
  scene.add(group);
  const resources = new Set<{ dispose: () => void }>();
  const own = <U extends { dispose: () => void }>(resource: U): U => {
    resources.add(resource); return resource;
  };
  const stone = own(new T.MeshStandardMaterial({ color: 0xeee6d7, roughness: .86, metalness: .01 }));
  const trim = own(new T.MeshStandardMaterial({ color: 0xb99a63, roughness: .56, metalness: .3 }));
  const mutedTrim = own(new T.MeshStandardMaterial({ color: 0xbdb5a6, roughness: .8, metalness: .08 }));
  const blue = own(new T.MeshBasicMaterial({ color: 0xcce0e5 }));
  const glass = own(new T.MeshBasicMaterial({ color: 0xf6f5e7, transparent: true, opacity: .5, depthWrite: false }));
  const dark = own(new T.MeshStandardMaterial({ color: 0x48556c, roughness: .8, metalness: .05 }));
  const box = (w: number, h: number, d: number, material: Three.Material, x: number, y: number, z: number) => {
    const mesh = new T.Mesh(own(new T.BoxGeometry(w, h, d)), material);
    mesh.position.set(x, y, z); group.add(mesh); return mesh;
  };

  // A backdrop behind the original props, outside their original walkable area.
  box(19.4, 6.9, .32, stone, 0, 3.25, -6.17);
  box(19.6, .2, .52, mutedTrim, 0, 6.65, -6.07);
  box(19.5, .055, .54, trim, 0, 6.48, -6.01);
  box(19.4, .28, .48, stone, 0, .18, -5.98);

  const windowWidth = 3.8;
  const windowBottom = .74;
  const windowHeight = 5.05;
  const r = windowWidth / 2;
  const spring = windowBottom + windowHeight - r;
  const arch = new T.Shape();
  arch.moveTo(-r, windowBottom);
  arch.lineTo(-r, spring);
  arch.absarc(0, spring, r, Math.PI, 0, true);
  arch.lineTo(r, windowBottom);
  arch.closePath();
  const archGeometry = own(new T.ShapeGeometry(arch, 30));

  [-4.8, 0, 4.8].forEach((x) => {
    const pane = new T.Mesh(archGeometry, blue);
    pane.position.set(x, 0, -5.965); group.add(pane);
    const outline: Three.Vector3[] = [new T.Vector3(x - r, windowBottom, -5.88), new T.Vector3(x - r, spring, -5.88)];
    for (let i = 1; i <= 36; i += 1) {
      const angle = Math.PI - Math.PI * i / 36;
      outline.push(new T.Vector3(x + Math.cos(angle) * r, spring + Math.sin(angle) * r, -5.88));
    }
    outline.push(new T.Vector3(x + r, windowBottom, -5.88));
    const frame = new T.Mesh(own(new T.TubeGeometry(new T.CatmullRomCurve3(outline), 72, .04, 6, false)), trim);
    group.add(frame);
    box(.048, windowHeight - .04, .045, trim, x, windowBottom + windowHeight / 2, -5.9);
    box(windowWidth, .05, .045, trim, x, spring - .02, -5.9);
    box(windowWidth, .048, .045, trim, x, windowBottom + 1.18, -5.9);
    box(windowWidth + .24, .15, .45, stone, x, windowBottom, -5.82);
    // Small diamond muntins give the existing room a crafted, not photographic, feel.
    [-.85, .85].forEach(dx => {
      const lozenge = new T.Mesh(own(new T.PlaneGeometry(.36, .36)), glass);
      lozenge.position.set(x + dx, spring - .66, -5.88);
      lozenge.rotation.z = Math.PI / 4;
      group.add(lozenge);
    });
  });

  // Discreet observatory instrument on the back ledge, never in the character path.
  const instrument = new T.Group();
  instrument.position.set(0, 2.12, -5.2);
  group.add(instrument);
  const ringGeometry = own(new T.TorusGeometry(.51, .017, 6, 56));
  for (let i = 0; i < 3; i += 1) {
    const ring = new T.Mesh(ringGeometry, trim);
    ring.rotation.set(i * .5, i * 1.03, .32);
    instrument.add(ring);
  }
  const orb = new T.Mesh(own(new T.IcosahedronGeometry(.17, 1)), dark);
  instrument.add(orb);
  box(.12, .55, .12, trim, 0, 1.61, -5.2);
  box(.56, .075, .4, dark, 0, 1.32, -5.2);

  // Floor inlays: ornaments, deliberately unrelated to customer quantities.
  const inlayMaterial = own(new T.LineBasicMaterial({ color: 0xb2a48b, transparent: true, opacity: .38, depthWrite: false }));
  const line = (points: Three.Vector3[], closed = false) => {
    const geometry = own(new T.BufferGeometry().setFromPoints(points));
    const object = closed ? new T.LineLoop(geometry, inlayMaterial) : new T.Line(geometry, inlayMaterial);
    group.add(object);
  };
  [0, .25].forEach(inset => line([
    new T.Vector3(-11.65 + inset, .008, -7.9 + inset), new T.Vector3(11.65 - inset, .008, -7.9 + inset),
    new T.Vector3(11.65 - inset, .008, 7.9 - inset), new T.Vector3(-11.65 + inset, .008, 7.9 - inset),
  ], true));
  [1.58, 1.69, 2.7].forEach(radius => line(Array.from({ length: 100 }, (_, i) => {
    const a = i / 100 * Math.PI * 2;
    return new T.Vector3(Math.cos(a) * radius - .7, .01, Math.sin(a) * radius + 1.1);
  }), true));
  for (let i = 0; i < 8; i += 1) {
    const a = i / 8 * Math.PI * 2;
    const c = Math.cos(a), s = Math.sin(a);
    const point = (rad: number, da = 0) => new T.Vector3(Math.cos(a + da) * rad - .7, .012, Math.sin(a + da) * rad + 1.1);
    line([point(.48), point(.9, .19), point(i % 2 ? 1.2 : 1.45), point(.9, -.19)], true);
    line([new T.Vector3(c * 2.54 - .7, .012, s * 2.54 + 1.1), new T.Vector3(c * 2.69 - .7, .012, s * 2.69 + 1.1)]);
  }

  // Procedural soft texture; no extra download or retained image/font asset.
  const softCanvas = document.createElement("canvas");
  softCanvas.width = softCanvas.height = 64;
  const context = softCanvas.getContext("2d");
  if (context) {
    const gradient = context.createRadialGradient(32, 32, 2, 32, 32, 31);
    gradient.addColorStop(0, "rgba(37,32,48,.27)");
    gradient.addColorStop(.35, "rgba(37,32,48,.15)");
    gradient.addColorStop(1, "rgba(37,32,48,0)");
    context.fillStyle = gradient; context.fillRect(0, 0, 64, 64);
  }
  const softTexture = own(new T.CanvasTexture(softCanvas));
  softTexture.colorSpace = T.SRGBColorSpace;
  const contactMaterial = own(new T.MeshBasicMaterial({ map: softTexture, transparent: true, depthWrite: false, opacity: .74 }));
  const contactGeometry = own(new T.PlaneGeometry(1.8, 1.8));
  const contacts = new Map<string, Three.Mesh>();
  const markerMaterial = own(new T.MeshBasicMaterial({ color: 0x8474ba, transparent: true, opacity: .62, depthWrite: false, side: T.DoubleSide }));
  const marker = new T.Mesh(own(new T.RingGeometry(.68, .705, 64)), markerMaterial);
  marker.rotation.x = -Math.PI / 2;
  marker.position.y = .024; marker.visible = false;
  group.add(marker);

  const atmosphere = new T.Group();
  group.add(atmosphere);
  const beams = own(new T.MeshBasicMaterial({ color: 0xffedc4, transparent: true, opacity: .036, depthWrite: false, side: T.DoubleSide }));
  [[4.8, 5.5, -5.7], [.1, 5.6, -5.7]].forEach(p => {
    const start = new T.Vector3(p[0], p[1], p[2]);
    const end = start.clone().add(new T.Vector3(-3.6, -5.3, 6.0));
    const ray = new T.Mesh(own(new T.CylinderGeometry(.28, 1.45, start.distanceTo(end), 12, 1, true)), beams);
    ray.position.copy(start.clone().add(end).multiplyScalar(.5));
    ray.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), start.clone().sub(end).normalize());
    atmosphere.add(ray);
  });
  const positions = new Float32Array(32 * 3);
  for (let i = 0; i < 32; i += 1) {
    // Fixed seed: stable, decorative positions; no business-data dependency.
    positions[i * 3] = Math.sin(i * 12.9898) * 7.2;
    positions[i * 3 + 1] = 1.5 + (Math.sin(i * 78.233) + 1) * 1.8;
    positions[i * 3 + 2] = -3.6 + (Math.cos(i * 39.425) + 1) * 2.6;
  }
  const dustGeometry = own(new T.BufferGeometry());
  dustGeometry.setAttribute("position", new T.BufferAttribute(positions, 3));
  const dustMaterial = own(new T.PointsMaterial({ color: 0xfff8df, size: .045, transparent: true, opacity: .6, depthWrite: false }));
  const dust = new T.Points(dustGeometry, dustMaterial);
  atmosphere.add(dust);
  let disposed = false;

  return {
    update(time: number, enabled: boolean, selectedKey: string, actors: ActorView[]) {
      if (disposed) return;
      atmosphere.visible = enabled;
      if (enabled) {
        dust.position.y = Math.sin(time * .15) * .12;
        dust.rotation.y = Math.sin(time * .035) * .025;
      }
      for (const actor of actors) {
        let contact = contacts.get(actor.segment.key);
        if (!contact) {
          contact = new T.Mesh(contactGeometry, contactMaterial);
          contact.rotation.x = -Math.PI / 2;
          group.add(contact);
          contacts.set(actor.segment.key, contact);
        }
        contact.position.set(actor.group.position.x, .018, actor.group.position.z);
        contact.scale.setScalar(actor.segment.characterHeight / 1.1);
        if (actor.segment.key === selectedKey) {
          marker.visible = true;
          marker.position.set(actor.group.position.x, .027, actor.group.position.z);
          markerMaterial.color.set(actor.segment.accent).multiplyScalar(.7);
        }
      }
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      scene.remove(group);
      resources.forEach(resource => resource.dispose());
      resources.clear(); contacts.clear(); group.clear();
    },
  };
}
