// service/officialService.js
const Connection = require("../db/Connection");
const { logAudit } = require("./auditService"); // Uncomment if needed

// ─── MUNICIPAL OFFICIALS ──────────────────────────────────────────────────────

exports.getMunicipalOfficials = async () => {
  return await Connection(
    `SELECT * FROM municipal_officials ORDER BY type DESC, id ASC`
  );
};

exports.addMunicipalOfficial = async (name, position, type, image, user) => {
  const result = await Connection(
    `INSERT INTO municipal_officials (name, position, type, image) VALUES (?, ?, ?, ?)`,
    [name, position, type, image]
  );

  if (result.affectedRows === 1 && user) {
    await logAudit(
      user.email,
      user.role,
      "CREATE",
      `Added municipal official '${name}' as ${position} (${type})`
    );
  }

  return result;
};

exports.updateMunicipalOfficial = async (
  id,
  name,
  position,
  type,
  image,
  user
) => {
  const [oldData] = await Connection(
    `SELECT name, position, type FROM municipal_officials WHERE id = ?`,
    [id]
  );

  const result = await Connection(
    `UPDATE municipal_officials SET name = ?, position = ?, type = ?, image = ? WHERE id = ?`,
    [name, position, type, image, id]
  );

  if (result.affectedRows === 1 && user) {
    const changes = [];
    if (oldData.name !== name)
      changes.push(`name: '${oldData.name}' → '${name}'`);
    if (oldData.position !== position)
      changes.push(`position: '${oldData.position}' → '${position}'`);
    if (oldData.type !== type)
      changes.push(`type: '${oldData.type}' → '${type}'`);
    await logAudit(
      user.email,
      user.role,
      "UPDATE",
      `Updated municipal official ${name}: ${changes.join(", ")}`
    );
  }

  return result;
};

exports.deleteMunicipalOfficial = async (id, user) => {
  const [official] = await Connection(
    `SELECT name FROM municipal_officials WHERE id = ?`,
    [id]
  );

  const result = await Connection(
    `DELETE FROM municipal_officials WHERE id = ?`,
    [id]
  );

  if (result.affectedRows === 1 && user) {
    await logAudit(
      user.email,
      user.role,
      "DELETE",
      `Deleted municipal official '${official?.name}'`
    );
  }

  return result;
};

// ─── BARANGAY OFFICIALS ──────────────────────────────────────────────────────

exports.addBarangayOfficial = async (
  barangay_name,
  president_name,
  position,
  image,
  user
) => {
  const result = await Connection(
    `INSERT INTO barangay_officials (barangay_name, president_name, position, image) VALUES (?, ?, ?, ?)`,
    [barangay_name, president_name, position, image]
  );

  if (result.affectedRows === 1 && user) {
    await logAudit(
      user.email,
      user.role,
      "CREATE",
      `Added barangay official '${barangay_name}'`
    );
  }

  return result;
};

exports.getBarangayOfficials = async () => {
  return await Connection(
    `SELECT * FROM barangay_officials ORDER BY barangay_name ASC`
  );
};

exports.updateBarangayOfficial = async (
  id,
  barangay_name,
  president_name,
  position,
  image, // could be null
  user
) => {
  const [oldData] = await Connection(
    `SELECT barangay_name, president_name, image FROM barangay_officials WHERE id = ?`,
    [id]
  );

  // Build dynamic query based on whether image was provided
  let query = `UPDATE barangay_officials SET barangay_name = ?, president_name = ?, position = ?`;
  const params = [barangay_name, president_name, position];

  if (image) {
    query += `, image = ?`;
    params.push(image);
  }

  query += ` WHERE id = ?`;
  params.push(id);

  const result = await Connection(query, params);

  // Optional audit logging
  if (result.affectedRows === 1 && user) {
    const changes = [];
    if (oldData.barangay_name !== barangay_name)
      changes.push(
        `barangay_name: '${oldData.barangay_name}' → '${barangay_name}'`
      );
    if (oldData.president_name !== president_name)
      changes.push(
        `president_name: '${oldData.president_name}' → '${president_name}'`
      );
    if (image && oldData.image !== image) changes.push(`image updated`);

    await logAudit(
      user.email,
      user.role,
      "UPDATE",
      `Updated barangay official ${president_name}: ${changes.join(", ")}`
    );
  }

  return result;
};

exports.deleteBarangayOfficial = async (id, user) => {
  const [barangay] = await Connection(
    `SELECT barangay_name FROM barangay_officials WHERE id = ?`,
    [id]
  );

  const result = await Connection(
    `DELETE FROM barangay_officials WHERE id = ?`,
    [id]
  );

  if (result.affectedRows === 1 && user) {
    await logAudit(
      user.email,
      user.role,
      "DELETE",
      `Deleted barangay official '${barangay?.barangay_name}'`
    );
  }

  return result;
};
