var mysql   = require("mysql");

function REST_ROUTER(router,connection,md5) {
    var self = this;
    self.handleRoutes(router,connection,md5);
}

REST_ROUTER.prototype.handleRoutes = function(router,connection,md5) {
    var self = this;
    router.get("/",function(req,res){
        res.json({"Message" : "Hello World !"});
    });

    var authCheck = function(user,pw) {
        if (user==="brandefy" && pw==="admin123") {
            var verified = true;
        } else {
            var verified = false;
        }
        return verified
    }

    var setPutParameters = function(req,res) {
        var parameters = "";
        var spacer = " ";
        var body = req.body;
        Object.keys(body).forEach(function(key) {
            parameters += `${spacer}${key}=${body[key]}`;
            spacer = ",";
        })
        return parameters;
    }

    var setPostParameters = function(req,res) {
        var parameters = "";
        var spacer = " ";
        var body = req.body;
        Object.keys(body).forEach(function(key) {
            parameters += `${spacer}${body[key]}`;
            spacer = ",";
        });
        return parameters;
    }

    var submitQuery = function(query,table,res) {
        var query = mysql.format(query);
        connection.query(query, function(err, result){
            if(err) {
                res.json({"error" : true, "code" : `Data not saved. There was a MySQL error: ${err.code}`});
            } else if (result.insertId==null) {
                res.json({"Error" : false, "Message" : "Success", [table] : result});
            } else if (result.insertId===0 && result.message=='') {
                console.log(result.affectedRows + ` ${table} record(s) deleted`);
                res.send(result);
            } else if (result.insertId===0 && result.message!='') {
                console.log(result.affectedRows + ` ${table} record(s) updated`);
                res.send(result);
            } else {
                console.log(result.affectedRows + ` ${table} record created`);
                res.send(result);
            }
        });
    }

    var submitQueryNoResp = function(query,table,res) {
        var query = mysql.format(query);
        connection.query(query, function(err, result){
            if(err) {
                res.json({"error" : true, "code" : `Data not saved. There was a MySQL error: ${err.code}`});
            } else if (result.insertId==null) {
                console.log(result.affectedRows + ` ${table} record(s) retrieved`);
            } else if (result.insertId===0 && result.message=='') {
                console.log(result.affectedRows + ` ${table} record(s) deleted`);
            } else if (result.insertId===0 && result.message!='') {
                console.log(result.affectedRows + ` ${table} record(s) updated`);
            } else {
                console.log(result.affectedRows + ` ${table} record created`);
            }
        });
    }

    // ####################################  RETAILERS  ####################################

    router.get("/retailers",function(req,res){
        // console.log(req.route.path, Object.keys(req.route.methods));
        var query = " SELECT rb.id,rb.r_name FROM retailers rb ORDER BY rb.id;";
        submitQuery(query,"retailers",res);
    });

    router.put("/retailers/:id",function(req,res){
        var verified = authCheck(req.body.user, req.body.pw);
        if (verified===true) {
            delete req.body.user;
            delete req.body.pw;
            var parameters = setPutParameters(req,res);
            var query = `UPDATE retailers SET${parameters} WHERE id=${req.params.id};`;
            submitQuery(query,"retailers", res);
        } else {
            console.log("Failed authentication.");
            res.json({"Error" : true, "Message" : "Failed authentication"});
        }
    });

    router.post("/retailers",function(req,res){
        var verified = authCheck(req.body.user, req.body.pw);
        if (verified===true) {
            delete req.body.user;
            delete req.body.pw;
            var parameters = setPostParameters(req,res);
            var query = `INSERT INTO retailers(r_name) values(${parameters});`;
            submitQuery(query,"retailers", res);
        } else {
            console.log("Failed authentication.");
            res.json({"Error" : true, "Message" : "Failed authentication"});
        }
    });

    // router.delete("/retailers/:id",function(req,res){
    //     var verified = authCheck(req.query.user, req.query.pw);
    //     if (verified===true) {
    //         delete req.body.user;
    //         delete req.body.pw;
    //         var query = `DELETE FROM retailers WHERE id=${req.params.id};`;
    //         submitQuery(query,"retailers", res);
    //     } else {
    //         console.log("Failed authentication.");
    //         res.json({"Error" : true, "Message" : "Failed authentication"});
    //     }
    // });

    // ####################################  BRANDS  ####################################

    router.get("/brands",function(req,res){
        var query = "SELECT b.bid AS id,b.b_name AS name,rb.id AS retailer_id, rb.r_name FROM brands b LEFT JOIN retailers rb ON b.retail_id=rb.id ORDER BY b.bid;";
        submitQuery(query,"brands",res);
    });

    router.put("/brands/:id",function(req,res){
        var verified = authCheck(req.body.user, req.body.pw);
        if (verified===true) {
            delete req.body.user;
            delete req.body.pw;
            var parameters = setPutParameters(req,res);
            var query = `UPDATE brands SET${parameters} WHERE bid=${req.params.id};`;
            submitQuery(query,"brands",res);
        } else {
            console.log("Failed authentication.");
            res.json({"Error" : true, "Message" : "Failed authentication"});
        }
    });

    router.post("/brands",function(req,res){
        var verified = authCheck(req.body.user, req.body.pw);
        if (verified===true) {
            delete req.body.user;
            delete req.body.pw;
            var parameters = setPostParameters(req,res);
            var query = `INSERT INTO brands(b_name, retail_id) values(${parameters});`;
            submitQuery(query,"brands",res);
        } else {
            console.log("Failed authentication.");
            res.json({"Error" : true, "Message" : "Failed authentication"});
        }
    });

    // router.delete("/brands/:id",function(req,res){
    //     var verified = authCheck(req.query.user, req.query.pw);
    //     if (verified===true) {
    //         delete req.body.user;
    //         delete req.body.pw;
    //         var query = `DELETE FROM brands WHERE bid=${req.params.id};`;
    //         submitQuery(query,"brands", res);
    //     } else {
    //         console.log("Failed authentication.");
    //         res.json({"Error" : true, "Message" : "Failed authentication"});
    //     }
    // });

    // ####################################  PRODUCTS  ####################################

    router.get("/product_data/:id",function(req,res){
        var query = ` SELECT JSON_OBJECT(
        'id', p.id,
        'name', p.p_name,
        'upca', p.upca,
        'brand', (SELECT CAST(GROUP_CONCAT(
                  JSON_OBJECT(
                      'bid',br.bid,'b_name',br.b_name))
                  AS JSON) FROM brands br WHERE p.brand_id = br.bid),
        'retailer', (SELECT CAST(GROUP_CONCAT(
                     JSON_OBJECT(
                         'retail_id',br.retail_id, 'r_name', rb.r_name))
                     AS JSON) FROM brands br, retailers rb WHERE p.brand_id = br.bid AND br.retail_id=rb.id),
        'image', (SELECT CAST(GROUP_CONCAT(
                  JSON_OBJECT(
                      'image_id',img.id,'image_link',img.image_link))
                  AS JSON) FROM product_images img WHERE img.p_id = p.id),
        'cat1', (SELECT CAST(GROUP_CONCAT(
                 JSON_OBJECT(
                     'prodCat_id',prodCat.id,'category', (SELECT CAST(GROUP_CONCAT(JSON_OBJECT('id',c.id,'c_name',c.c_name,'type_id',c.type_id)) AS JSON) FROM categories c WHERE prodCat.c_id=c.id) ))
                 AS JSON) FROM product_categories prodCat, categories c WHERE prodCat.p_id = p.id AND prodCat.c_id=c.id AND c.type_id=1)
        ) AS JSON
        FROM products AS p
        JOIN brands AS br ON p.brand_id=br.bid
        LEFT JOIN retailers AS rb ON br.retail_id=rb.id
        WHERE p.id=${req.params.id}
        ORDER BY p.id;`;
        submitQuery(query,"products",res);
    });

    router.get("/product_data",function(req,res){
        var query = ` SELECT p.id, p.p_name AS name, p.upca, p.brand_id,br.b_name,br.id AS retailer_id, br.r_name, cat1.c_name AS cat1_name, cat2.categories, img.image_link, ing.ingredients
        FROM products p
        JOIN (SELECT b.bid,b.b_name,rb.id,rb.r_name
            FROM brands b
            LEFT JOIN retailers rb
            ON b.retail_id=rb.id) br
            ON br.bid=p.brand_id
        LEFT JOIN (SELECT prodIng.p_id, GROUP_CONCAT(i.i_name ORDER BY i.id SEPARATOR ', ') AS ingredients
            FROM product_ingredients prodIng, ingredients i
            WHERE prodIng.i_id=i.id
            GROUP BY prodIng.p_id) ing
            ON ing.p_id=p.id
        LEFT JOIN (SELECT prodCat.p_id, c.c_name
            FROM product_categories prodCat, categories c
            WHERE c.type_id=1
            AND prodCat.c_id=c.id) cat1
            ON cat1.p_id=p.id
        LEFT JOIN (SELECT prodCat.p_id, GROUP_CONCAT(c.c_name ORDER BY c.id SEPARATOR ', ') AS categories
            FROM product_categories prodCat, categories c
            WHERE prodCat.c_id=c.id AND c.type_id=2
            GROUP BY prodCat.p_id) cat2
            ON cat2.p_id=p.id
        LEFT JOIN (SELECT image.p_id, image.image_link
            FROM product_images image
            WHERE image.primary_link=1) img
            ON img.p_id=p.id
        ORDER BY p.id;`;
        submitQuery(query,"products",res);
        // var query = `SELECT p.id,p.UPCA,p.p_name,br.*,pri.product_ingredients, pimg.product_images, cat1.primary_category, cat2.secondary_categories
        //  FROM products p JOIN (SELECT b.bid,b.b_name,r.r_name FROM brands b JOIN retailers r on b.retail_id=r.id) br ON br.bid=p.brand_id
        //  JOIN (SELECT CAST(CONCAT('[',
        //         GROUP_CONCAT(
        //           JSON_OBJECT(
        //             'id',i.id,'pi_id', pi.id,'ingredient_name',i_name,'active',pi.active)),
        //         ']')
        //  AS JSON) AS product_ingredients, pi.p_id FROM product_ingredients pi JOIN ingredients i ON pi.i_id=i.id group by pi.p_id) AS pri ON pri.p_id=p.id
        //  JOIN (SELECT CAST(CONCAT('[',
        //         GROUP_CONCAT(
        //           JSON_OBJECT(
        //             'id',id,'image_link',image_link,'primary_link',if(primary_link=1,'TRUE','FALSE'))),
        //         ']')
        //  AS JSON) AS product_images, p_id FROM product_images GROUP BY p_id) AS pimg ON pimg.p_id=p.id
        //  JOIN (SELECT CAST(CONCAT('[',
        //         GROUP_CONCAT(
        //           JSON_OBJECT(
        //             'prodCat.id',pc.id,'p_id',pc.p_id,'c_id',c.id,'c_name',c.c_name,'type_id',c.type_id)),
        //         ']')
        //  AS JSON) AS primary_category, p_id FROM product_categories pc JOIN categories c ON pc.c_id=c.id WHERE c.type_id=1 GROUP BY pc.p_id) AS cat1 ON cat1.p_id=p.id
        //  JOIN (SELECT CAST(CONCAT('[',
        //         GROUP_CONCAT(
        //           JSON_OBJECT(
        //             'prodCat.id',pc.id,'p_id',pc.p_id,'c_id',c.id,'c_name',c.c_name,'type_id',c.type_id)),
        //         ']')
        //  AS JSON) AS secondary_categories, p_id FROM product_categories pc JOIN categories c ON pc.c_id=c.id WHERE c.type_id=1 GROUP BY pc.p_id) AS cat2 ON cat2.p_id=p.id;`;
        //  var query = mysql.format(query);
        //  connection.query(query, function(err, result){
        //      if(err) {
        //          res.json({"error" : true, "code" : `Data not saved. There was a MySQL error: ${err.code}`});
        //      } else {
        //          result.map(function(row) {
        //              row.product_ingredients = JSON.parse(row.product_ingredients);
        //              row.product_images = JSON.parse(row.product_images);
        //              row.primary_category = JSON.parse(row.primary_category);
        //              row.secondary_categories = JSON.parse(row.secondary_categories);
        //          });
        //          res.json({"Error" : false, "Message" : "Success", products : result});
        //      }
        //  });
    });

    router.put("/product_data/:id",function(req,res){
        var verified = authCheck(req.body.user, req.body.pw);
        if (verified===true) {
            delete req.body.user;
            delete req.body.pw;
            var body = req.body;
            if (body.image_link) {
                // hard code primary photo edits for now
                var query = `UPDATE product_images SET image_link=${body.image_link} WHERE p_id=${body.id} AND primary_link=1;`;
                submitQueryNoResp(query,"product_images",res);
            }
            if (body.prodCat1) {
                var query = `UPDATE product_categories SET c_id=${body.cat1.id} WHERE id=${body.prodCat1}`;
                submitQueryNoResp(query,"product_categories",res);
            }
            if (body.new_cat1) {
                var query = `INSERT INTO product_categories(p_id, c_id) values (${body.id}, ${body.new_cat1.id});`;
                submitQueryNoResp(query,"product_categories",res);
            }
            if (body.new_categories[0]) {
                body.new_categories.forEach(function(cat) {
                    var query = `INSERT INTO product_categories(p_id, c_id) values(${body.id}, ${cat.id});`;
                    submitQueryNoResp(query,"product_categories",res);
                });
            }
            if (body.delete_categories[0]) {
                body.delete_categories.forEach(function(cat) {
                    var query = `DELETE FROM product_categories WHERE id=${cat.prodCat_id};`;
                    submitQueryNoResp(query,"product_categories",res);
                });
            }
            if (body.new_ingredients[0]) {
                body.new_ingredients.forEach(function(ing) {
                    var query = `INSERT INTO product_ingredients(p_id, i_id) values(${body.id}, ${ing.id});`;
                    submitQueryNoResp(query,"product_ingredients", res);
                });
            }
            if (body.delete_ingredients[0]) {
                body.delete_ingredients.forEach(function(ing) {
                    var query = `DELETE FROM product_ingredients WHERE id=${ing.prodIng_id};`;
                    submitQueryNoResp(query,"product_ingredients",res);
                });
            }
            if (body.upca || body.p_name || body.brand_id) {
                var parameters = "";
                var spacer = " ";
                var productPutParams = {};
                if (body.upca) {
                    productPutParams.upca = body.upca;
                }
                if (body.p_name) {
                    productPutParams.p_name = body.p_name;
                }
                if (body.brand_id) {
                    productPutParams.brand_id = body.brand_id;
                }
                Object.keys(productPutParams).forEach(function(key) {
                    parameters += `${spacer}${key}=${productPutParams[key]}`;
                    spacer = ",";
                })
                var query = `UPDATE products SET${parameters} WHERE id=${body.id};`;
                submitQuery(query,"products",resp);
            } else {
                res.send("result");
            }
        } else {
            console.log("Failed authentication.");
            res.json({"Error" : true, "Message" : "Failed authentication"});
        }
    });

    router.post("/product_data",function(req,res){
        var verified = authCheck(req.body.user, req.body.pw);
        if (verified===true) {
            delete req.body.user;
            delete req.body.pw;
            var parameters = "";
            var spacer = " ";
            var body = req.body;
            var p_name = body.p_name;
            var brand_id = body.brand_id;
            if (body.upca) {
                var upca = body.upca;
                var query = `INSERT INTO products(UPCA, p_name, brand_id) values(${upca}, ${p_name}, ${brand_id});`;
            } else {
                var query = `INSERT INTO products(p_name, brand_id) values(${p_name}, ${brand_id});`;
            }
            query = mysql.format(query);
            connection.query(query,function(err, result){
                if(err) {
                    res.json({"error" : true, "code" : `Data not saved. There was a MySQL error: ${err.code}`});
                } else {
                    console.log(result.affectedRows + " product record(s) created");
                    var insertId = result.insertId;
                    if (body.cat1) {
                        var query = `INSERT INTO product_categories(p_id, c_id) values(${insertId}, ${body.cat1.id});`;
                        submitQueryNoResp(query,"primary product_categories",res);
                    }
                    if (body.cats2[0]) {
                        body.cats2.forEach(function(cat) {
                            var query = `INSERT INTO product_categories(p_id, c_id) values(${insertId}, ${cat.id});`;
                            submitQueryNoResp(query,"secondary product_categories",res);
                        });
                    }
                    if (body.ingredients) {
                        body.ingredients.forEach(function(ing) {
                            var query = `INSERT INTO product_ingredients(p_id, i_id) values(${insertId}, ${ing.id});`;
                            submitQueryNoResp(query,"product_ingredients",res);
                        });
                    }
                    if (body.image_link) {
                        // hard code primary link
                        var query = `INSERT INTO product_images(p_id, image_link, primary_link) values(${insertId}, ${body.image_link}, 1);`;
                        submitQueryNoResp(query,"product_images",res);
                    }
                    res.send(result);
                }
            });
        } else {
            console.log("Failed authentication.");
            res.json({"Error" : true, "Message" : "Failed authentication"});
        }
    });

    // router.delete("/product_data/:id",function(req,res){
    //     var verified = authCheck(req.query.user, req.query.pw);
    //     if (verified===true) {
    //         delete req.body.user;
    //         delete req.body.pw;
    //         var query = `DELETE FROM product_categories WHERE p_id=${req.params.id};`;
    //         var query = mysql.format(query);
    //         connection.query(query, function(err, result){
    //             if(err) {
    //                 res.json({"error" : true, "code" : `Data not saved. There was a MySQL error: ${err.code}`});
    //             } else {
    //                 console.log(result.affectedRows + ` product_categories record(s) deleted`);
    //                 var query = `DELETE FROM product_ingredients WHERE p_id=${req.params.id};`;
    //                 var query = mysql.format(query);
    //                 connection.query(query, function(err, result){
    //                     if(err) {
    //                         res.json({"error" : true, "code" : `Data not saved. There was a MySQL error: ${err.code}`});
    //                     } else {
    //                         console.log(result.affectedRows + ` product_ingredients record(s) deleted`);
    //                         var query = `DELETE FROM product_comp WHERE brand_pid=${req.params.id} OR generic_pid=${req.params.id};`;
    //                         var query = mysql.format(query);
    //                         connection.query(query, function(err, result){
    //                             if(err) {
    //                                 res.json({"error" : true, "code" : `Data not saved. There was a MySQL error: ${err.code}`});
    //                             } else {
    //                                 console.log(result.affectedRows + ` comparison record(s) deleted`);
    //                                 var query = `DELETE FROM product_images WHERE p_id=${req.params.id};`;
    //                                 var query = mysql.format(query);
    //                                 connection.query(query, function(err, result){
    //                                     if(err) {
    //                                         res.json({"error" : true, "code" : `Data not saved. There was a MySQL error: ${err.code}`});
    //                                     } else {
    //                                         console.log(result.affectedRows + ` product_images record(s) deleted`);
    //                                         var query = `DELETE FROM products WHERE id=${req.params.id};`;
    //                                         var query = mysql.format(query);
    //                                         connection.query(query, function(err, result){
    //                                             if(err) {
    //                                                 res.json({"error" : true, "code" : `Data not saved. There was a MySQL error: ${err.code}`});
    //                                             } else {
    //                                                 console.log(result.affectedRows + ` product record(s) deleted`);
    //                                                 res.send(result);
    //                                             }
    //                                         });
    //                                     }
    //                                 });
    //                             }
    //                         });
    //                     }
    //                 });
    //             }
    //         });
    //     } else {
    //         console.log("Failed authentication.");
    //         res.json({"Error" : true, "Message" : "Failed authentication"});
    //     }
    // });

    // ####################################  INGREDIENTS  ####################################

     router.get("/ingredients",function(req,res){
         var query = `SELECT i.id, i.i_name, i.synonyms,if(i.issulfate=1,1,0) as sulfate, if(i.isparaben=1,1,0) as paraben from ingredients i ORDER BY i.id;`;
         submitQuery(query,"ingredients",res);
     });

     router.put("/ingredients/:id",function(req,res){
         var verified = authCheck(req.body.user, req.body.pw);
         if (verified===true) {
             delete req.body.user;
             delete req.body.pw;
             var parameters = setPutParameters(req,res);
             var query = `UPDATE ingredients SET${parameters} WHERE id=${req.params.id};`;
             submitQuery(query,"ingredients",res);
         } else {
             console.log("Failed authentication.");
             res.json({"Error" : true, "Message" : "Failed authentication"});
         }
     });

     router.post("/ingredients",function(req,res){
         var verified = authCheck(req.body.user, req.body.pw);
         if (verified===true) {
             delete req.body.user;
             delete req.body.pw;
             var parameters = setPostParameters(req,res);
             var query = `INSERT INTO ingredients(i_name, issulfate, isparaben) values(${parameters});`;
             submitQuery(query,"ingredients",res);
         } else {
             console.log("Failed authentication.");
             res.json({"Error" : true, "Message" : "Failed authentication"});
         }
     });

     // router.delete("/ingredients/:id",function(req,res){
     //     var verified = authCheck(req.query.user, req.query.pw);
     //     if (verified===true) {
     //         delete req.body.user;
     //         delete req.body.pw;
     //         var query = `DELETE FROM ingredients WHERE id=${req.params.id};`;
     //         var query = mysql.format(query);
     //         connection.query(query, function(err, result){
     //             if(err) {
     //                 res.json({"error" : true, "code" : `Data not saved. There was a MySQL error: ${err.code}`});
     //             } else {
     //                 console.log(result.affectedRows + ` ingredients record(s) deleted`);
     //                 var query = `DELETE FROM product_ingredients WHERE i_id=${req.params.id};`;
     //                 var query = mysql.format(query);
     //                 connection.query(query, function(err, result){
     //                     if(err) {
     //                         res.json({"error" : true, "code" : `Data not saved. There was a MySQL error: ${err.code}`});
     //                     } else {
     //                         console.log(result.affectedRows + ` product_ingredients record(s) deleted`);
     //                         res.send(result);
     //                     }
     //                 });
     //             }
     //         });
     //     } else {
     //         console.log("Failed authentication.");
     //         res.json({"Error" : true, "Message" : "Failed authentication"});
     //     }
     // });

    // ####################################  PRODUCT INGREDIENTS  ####################################

    router.get("/product_ingredients/:id",function(req,res){
        var query = ` SELECT JSON_OBJECT(
        'prodIng_id', prodIng.id,
        'ingredient', JSON_OBJECT(
                      'id',i.id,'i_name',i.i_name,'is_sulfate',i.issulfate, 'is_paraben', i.isparaben)
                      ) AS JSON
        FROM product_ingredients prodIng, ingredients i WHERE prodIng.i_id = i.id AND prodIng.p_id = ${req.params.id}
        GROUP BY prodIng.id
        ORDER BY prodIng.id;`;
        submitQuery(query,"product_ingredients",res);
    });

    router.get("/product_ingredients",function(req,res){
        var query = ` SELECT prodIng.id, prodIng.p_id, i.id, i.i_name, prodIng.active FROM product_ingredients prodIng
        LEFT JOIN ingredients i
        ON prodIng.i_id=i.id
        ORDER BY i.id;`;
        submitQuery(query,"product_ingredients",res);
    });

    router.put("/product_ingredients/:id",function(req,res){
        var verified = authCheck(req.body.user, req.body.pw);
        if (verified===true) {
            delete req.body.user;
            delete req.body.pw;
            var parameters = setPutParameters(req,res);
            var query = `UPDATE product_ingredients SET${parameters} WHERE id=${req.params.id};`;
            submitQuery(query,"product_ingredients",res);
        } else {
            console.log("Failed authentication.");
            res.json({"Error" : true, "Message" : "Failed authentication"});
        }
    });

    router.post("/product_ingredients",function(req,res){
        var verified = authCheck(req.body.user, req.body.pw);
        if (verified===true) {
            delete req.body.user;
            delete req.body.pw;
            var parameters = setPostParameters(req,res);
            var query = `INSERT INTO product_ingredients(p_id, i_id, active) values(${parameters});`;
            submitQuery(query,"product_ingredients",res);
        } else {
            console.log("Failed authentication.");
            res.json({"Error" : true, "Message" : "Failed authentication"});
        }
    });


    // ####################################  CATEGORIES  ####################################

    router.get("/categories",function(req,res){
        var query = ` SELECT cat.id,cat.c_name,cat.type_id,catType.level,catRels.id as rel_id, parent.parent_cid,parent.c_name AS parent_name
        FROM categories cat
        LEFT JOIN category_types catType ON cat.type_id=catType.id
        LEFT JOIN category_rels catRels ON cat.id=catRels.child_cid
        LEFT JOIN (SELECT catRels.child_cid, catRels.parent_cid, c.c_name
            FROM category_rels catRels, categories c
            WHERE catRels.parent_cid=c.id) parent
            ON parent.child_cid=cat.id
        ORDER BY cat.id;`;
        submitQuery(query,"categories",res);
    });

    router.put("/categories/:id",function(req,res){
        var verified = authCheck(req.body.user, req.body.pw);
        if (verified===true) {
            delete req.body.user;
            delete req.body.pw;
            var body = req.body;
            console.log(body);
            if (body.rel_id) {
                var query = `UPDATE category_rels SET parent_cid=${body.parent_cid} WHERE id=${body.rel_id}`;
                submitQueryNoResp(query,"category_rels",res);
            }
            if (body.rel_id_remove) {
                var query = `DELETE FROM category_rels WHERE id=${body.rel_id_remove};`;
                submitQueryNoResp(query,"category_rels",res);
            }
            if (body.new_parent) {
                var query = `INSERT INTO category_rels(parent_cid, child_cid) values (${body.new_parent}, ${body.id});`;
                submitQueryNoResp(query,"category_rels",res);
            }
            if (body.c_name || body.type_id) {
                var parameters = "";
                var spacer = " ";
                var categoryPutParams = {};
                if (body.c_name) {
                    categoryPutParams.c_name = body.c_name;
                }
                if (body.type_id) {
                    categoryPutParams.type_id = body.type_id;
                }
                Object.keys(categoryPutParams).forEach(function(key) {
                    parameters += `${spacer}${key}=${categoryPutParams[key]}`;
                    spacer = ",";
                })
                var query = `UPDATE categories SET${parameters} WHERE id=${body.id};`;
                submitQuery(query,"categories",res);
            } else {
                res.send("result");
            }
        } else {
            console.log("Failed authentication.");
            res.json({"Error" : true, "Message" : "Failed authentication"});
        }
    });

    router.post("/categories",function(req,res){
        var verified = authCheck(req.body.user, req.body.pw);
        if (verified===true) {
            delete req.body.user;
            delete req.body.pw;
            var query = `INSERT INTO categories(c_name, type_id) values(${req.body.c_name}, ${req.body.type_id});`;
            var query = mysql.format(query);
            connection.query(query, function(err, result){
                if(err) {
                    res.json({"error" : true, "code" : `Data not saved. There was a MySQL error: ${err.code}`});
                } else {
                    console.log(result.affectedRows + ` category record created`);
                    var insertId = result.insertId;
                    if (req.body.parent_cid) {
                        var query = mysql.format(`INSERT INTO category_rels(parent_cid, child_cid) values(${req.body.parent_cid}, ${insertId});`);
                        connection.query(query, function(err, result){
                            if(err) {
                                res.json({"error" : true, "code" : `Data not saved. There was a MySQL error: ${err.code}`});
                            } else {
                                console.log(result.affectedRows + ` category_rel record created`);
                            }
                        });
                    }
                }
                res.send(result);
            });
        } else {
            console.log("Failed authentication.");
            res.json({"Error" : true, "Message" : "Failed authentication"});
        }
    });

    // router.delete("/categories/:id",function(req,res){
    //     var verified = authCheck(req.query.user, req.query.pw);
    //     if (verified===true) {
    //         delete req.body.user;
    //         delete req.body.pw;
    //         var query = `DELETE FROM product_categories WHERE c_id=${req.params.id};`;
    //         var query = mysql.format(query);
    //         connection.query(query, function(err, result){
    //             if(err) {
    //                 res.json({"error" : true, "code" : `Data not saved. There was a MySQL error: ${err.code}`});
    //             } else {
    //                 console.log(result.affectedRows + ` product_categories record(s) deleted`);
    //                 var query = `DELETE FROM category_rels WHERE parent_cid=${req.params.id} OR child_cid=${req.params.id};`;
    //                 var query = mysql.format(query);
    //                 connection.query(query, function(err, result){
    //                     if(err) {
    //                         res.json({"error" : true, "code" : `Data not saved. There was a MySQL error: ${err.code}`});
    //                     } else {
    //                         console.log(result.affectedRows + ` category_rels record(s) deleted`);
    //                         var query = `DELETE FROM categories WHERE id=${req.params.id};`;
    //                         var query = mysql.format(query);
    //                         connection.query(query, function(err, result){
    //                             if(err) {
    //                                 res.json({"error" : true, "code" : `Data not saved. There was a MySQL error: ${err.code}`});
    //                             } else {
    //                                 console.log(result.affectedRows + ` categories record(s) deleted`);
    //                                 res.send(result);
    //                             }
    //                         });
    //                     }
    //                 });
    //             }
    //         });
    //     } else {
    //         console.log("Failed authentication.");
    //         res.json({"Error" : true, "Message" : "Failed authentication"});
    //     }
    // });

    // ####################################  CATEGORY TYPES  ####################################

    router.get("/category_types",function(req,res){
        var query = " SELECT catType.id,catType.level FROM category_types catType ORDER BY catType.id;";
        submitQuery(query,"category_types",res);
    });

    // ####################################  PRODUCT CATEGORIES  ####################################

    router.get("/product_categories/:id",function(req,res){
        var query = ` SELECT JSON_OBJECT(
        'prodCat_id', prodCat.id,
        'category', JSON_OBJECT(
                        'id',c.id,'c_name',c.c_name,'type_id',c.type_id)
                    ) AS JSON
        FROM product_categories prodCat, categories c
        WHERE prodCat.c_id = c.id AND prodCat.p_id = ${req.params.id} AND c.type_id=2
        GROUP BY prodCat.id
        ORDER BY prodCat.id;`;
        submitQuery(query,"product_categories",res);
    });

    router.get("/product_categories",function(req,res){
        var query = " SELECT prodCat.id, prodCat.p_id, prodCat.c_id FROM product_categories prodCat ORDER BY prodCat.id;";
        submitQuery(query,"product_categories",res);
    });

    router.put("/product_categories/:id",function(req,res){
        var verified = authCheck(req.body.user, req.body.pw);
        if (verified===true) {
            delete req.body.user;
            delete req.body.pw;
            var parameters = setPutParameters(req,res);
            var query = `UPDATE product_categories SET${parameters} WHERE id=${req.params.id};`;
            submitQuery(query,"product_categories",res);
        } else {
            console.log("Failed authentication.");
            res.json({"Error" : true, "Message" : "Failed authentication"});
        }
    });

    router.post("/product_categories",function(req,res){
        var verified = authCheck(req.body.user, req.body.pw);
        if (verified===true) {
            delete req.body.user;
            delete req.body.pw;
            var parameters = setPostParameters(req,res);
            var query = `INSERT INTO product_categories(p_id, c_id) values(${parameters});`;
            submitQuery(query,"product_categories",res);
        } else {
            console.log("Failed authentication.");
            res.json({"Error" : true, "Message" : "Failed authentication"});
        }
    });

    // ####################################  PRODUCT IMAGES  ####################################

    router.get("/product_images",function(req,res){
        var query = " SELECT image.id, image.p_id, image.image_link, image.primary_link FROM product_images image ORDER BY image.id;";
        submitQuery(query,"product_images",res);
    });

    router.put("/product_images/:id",function(req,res){
        var verified = authCheck(req.body.user, req.body.pw);
        if (verified===true) {
            delete req.body.user;
            delete req.body.pw;
            var parameters = setPutParameters(req,res);
            var query = `UPDATE product_images SET${parameters} WHERE id=${req.params.id};`;
            submitQuery(query,"product_images",res);
        } else {
            console.log("Failed authentication.");
            res.json({"Error" : true, "Message" : "Failed authentication"});
        }
    });

    router.post("/product_images",function(req,res){
        var verified = authCheck(req.body.user, req.body.pw);
        if (verified===true) {
            delete req.body.user;
            delete req.body.pw;
            var parameters = setPostParameters(req,res);
            // hard code primary link as 1 (for now)
            var query = `INSERT INTO product_images(p_id, image_link, primary_link) values(${parameters}, 1);`;
            submitQuery(query,"product_images",res);
        } else {
            console.log("Failed authentication.");
            res.json({"Error" : true, "Message" : "Failed authentication"});
        }
    });

    // ####################################  COMPS  ####################################

    router.get("/comparisons",function(req,res){
        var query = ` SELECT pc.id,pc.brand_pid,p1.p_name AS brand_pname,br1.bid AS brand_bid, br1.b_name AS brand_bname,pc.generic_pid,p2.p_name AS generic_pname, br2.bid AS generic_bid, br2.b_name AS generic_bname,br2.r_name,pc.overall_similarity AS similarity_score,pc.ingredient_match,pc.b_review
        FROM product_comp pc
        JOIN products p1 on p1.id=pc.brand_pid
        JOIN products p2 on p2.id=pc.generic_pid
        JOIN (SELECT b.bid,b.b_name,rb.id, rb.r_name FROM brands b
            LEFT JOIN retailers rb
            ON b.retail_id=rb.id) br1
        ON br1.bid=p1.brand_id
        JOIN (SELECT b.bid,b.b_name,rb.id, rb.r_name FROM brands b
            LEFT JOIN retailers rb
            ON b.retail_id=rb.id) br2
        ON br2.bid=p2.brand_id
        ORDER BY pc.id;`;
        submitQuery(query,"comparisons",res);
    });

    router.put("/comparisons/:id",function(req,res){
        var verified = authCheck(req.body.user, req.body.pw);
        if (verified===true) {
            delete req.body.user;
            delete req.body.pw;
            var parameters = setPutParameters(req,res);
            var query = `UPDATE product_comp SET${parameters} WHERE id=${req.params.id};`;
            submitQuery(query,"comparisons",res);
        } else {
            console.log("Failed authentication.");
            res.json({"Error" : true, "Message" : "Failed authentication"});
        }
    });

    router.post("/comparisons",function(req,res){
        var verified = authCheck(req.body.user, req.body.pw);
        if (verified===true) {
            delete req.body.user;
            delete req.body.pw;
            var parameters = setPostParameters(req,res);
            var query = `INSERT INTO product_comp(brand_pid, generic_pid, overall_similarity, ingredient_match, b_review) values(${parameters});`;
            submitQuery(query,"comparisons",res);
        } else {
            console.log("Failed authentication.");
            res.json({"Error" : true, "Message" : "Failed authentication"});
        }
    });

    // router.delete("/comparisons/:id",function(req,res){
    //     var verified = authCheck(req.query.user, req.query.pw);
    //     if (verified===true) {
    //         delete req.body.user;
    //         delete req.body.pw;
    //         var query = `DELETE FROM product_comp WHERE id=${req.params.id};`;
    //         submitQuery(query,"comparisons", res);
    //     } else {
    //         console.log("Failed authentication.");
    //         res.json({"Error" : true, "Message" : "Failed authentication"});
    //     }
    // });

    // ####################################  OTHER  ####################################

    router.get("/feedback",function(req,res){
        var query = `SELECT f.id, f.fname, f.email,f.message, f.date_added from feedback f ORDER BY f.id;`;
        submitQuery(query,"feedback",res);
    });

    router.get("/subscribers",function(req,res){
        var query = `SELECT sub.id, sub.email,sub.date_added from subscribers sub ORDER BY sub.id;`;
        submitQuery(query,"subscribers",res);
    });

    router.get("/product_review_requests",function(req,res){
        var query = `SELECT prr.id,prr.product_name,prr.store_name,prr.email,if(prr.can_help=1,1,0) AS can_help,prr.date_added from product_review_requests prr ORDER BY prr.id;`;
        submitQuery(query,"review_requests",res);
    });

    router.get("/comments",function(req,res){
        // var query = `SELECT * FROM product_reviews`;
        var query = `SELECT pr.id, pr.p_id AS comp_id, brand.p_name AS brand_name, brand.b_name AS brand_brand, generic.p_name AS generic_name, generic.b_name as generic_brand, pr.u_id, pr.review, pr.date_added from product_reviews pr
                    JOIN (SELECT pc.id, p1.p_name, b1.b_name FROM product_comp pc, products p1, brands b1 WHERE pc.brand_pid=p1.id AND p1.brand_id=b1.bid) AS brand ON pr.p_id=brand.id
                    JOIN (SELECT pc.id, p2.p_name, b2.b_name FROM product_comp pc, products p2, brands b2 WHERE pc.generic_pid=p2.id AND p2.brand_id=b2.bid) AS generic ON pr.p_id=generic.id
                    ORDER BY pr.id;`;
        submitQuery(query,"comments",res);
    });

    router.delete("/comments/:id",function(req,res){
        var verified = authCheck(req.query.user, req.query.pw);
        if (verified===true) {
            delete req.body.user;
            delete req.body.pw;
            var query = `DELETE FROM product_reviews WHERE id=${req.params.id};`;
            submitQuery(query,"comments", res);
        } else {
            console.log("Failed authentication.");
            res.json({"Error" : true, "Message" : "Failed authentication"});
        }
    });


}

module.exports = REST_ROUTER;
