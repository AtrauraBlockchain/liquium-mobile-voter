/*jslint node: true */
"use strict";

var async = require('async');
var ethConnector = require('ethconnector');
var path = require('path');
var _ = require('lodash');
var BigNumber = require('bignumber.js');
var rlp = require('rlp');

var src;

exports.deployOrganization = deployOrganization;
exports.deployDelegateStatusFactory = deployDelegateStatusFactory;
exports.deploySingleChoice = deploySingleChoice;

function deployOrganization (opts, cb) {
    var organizationAbi;
    var organization;
    var compilationResult = {};
    return async.series([
        function(cb) {
            ethConnector.loadSol(path.join(__dirname, "../Organization.sol"), function(err, _src) {
                if (err) return cb(err);
                src = _src;
                cb();
            });
        },
        function(cb) {
            ethConnector.applyConstants(src, opts, function(err, _src) {
                if (err) return cb(err);
                src = _src;
                cb();
            });
        },
        function(cb) {
            compilationResult.srcVault = src;
            ethConnector.compile(src, function(err, result) {
                if (err) return cb(err);
                compilationResult = _.extend(result, compilationResult);
                cb();
            });
        },
        function(cb) {
            if (!opts.delegateStatusFactory) {
                ethConnector.deploy(
                    compilationResult.DelegateStatusFactory.interface,
                    compilationResult.DelegateStatusFactory.bytecode,
                    0,
                    0,
                    function(err, _delegateStatusFactory) {
                        if (err) return cb(err);
                        opts.delegateStatusFactory = _delegateStatusFactory.address;
                        cb();
                    });
            } else {
                cb();
            }
        },
        function(cb) {
            organizationAbi = JSON.parse(compilationResult.Organization.interface);
            ethConnector.deploy(compilationResult.Organization.interface,
                compilationResult.Organization.bytecode,
                0,
                0,
                opts.delegateStatusFactory,
                function(err, _organization) {
                    if (err) return cb(err);
                    organization = _organization;
                    cb();
                });
        },
    ], function(err) {
        if (err) return cb(err);
        cb(null,organization, compilationResult);
    });
}

function deployDelegateStatusFactory(opts, cb) {
    var delegateStatusFactoryAbi;
    var delegateStatusFactory;
    var compilationResult = {};
    return async.series([
        function(cb) {
            ethConnector.loadSol(path.join(__dirname, "../Organization.sol"), function(err, _src) {
                if (err) return cb(err);
                src = _src;
                cb();
            });
        },
        function(cb) {
            ethConnector.applyConstants(src, opts, function(err, _src) {
                if (err) return cb(err);
                src = _src;
                cb();
            });
        },
        function(cb) {
            compilationResult.srcVault = src;
            ethConnector.compile(src, function(err, result) {
                if (err) return cb(err);
                compilationResult = _.extend(result, compilationResult);
                cb();
            });
        },
        function(cb) {
            delegateStatusFactoryAbi = JSON.parse(compilationResult.DelegateStatusFactory.interface);
            ethConnector.deploy(compilationResult.DelegateStatusFactory.interface,
                compilationResult.DelegateStatusFactory.bytecode,
                0,
                0,
                function(err, _delegateStatusFactory) {
                    if (err) return cb(err);
                    delegateStatusFactory = _delegateStatusFactory;
                    cb();
                });
        },
    ], function(err) {
        if (err) return cb(err);
        cb(null,delegateStatusFactory, compilationResult);
    });
}

function deploySingleChoice(organization, definition, cb) {
    var singleChoiceAbi;
    var singleChoice;
    var owner;
    var idPoll;

    var d = [
        new Buffer(definition.question),
        _.map(definition.options, function(o) {
            return new Buffer(o);
        })
    ];

    var b= rlp.encode(d);
    var rlpDefinition =  '0x' + b.toString('hex');

    var compilationResult = {};
    return async.series([
        function(cb) {
            ethConnector.loadSol(path.join(__dirname, "../SingleChoice.sol"), function(err, _src) {
                if (err) return cb(err);
                src = _src;
                cb();
            });
        },
        function(cb) {
            compilationResult.srcVault = src;
            ethConnector.compile(src, function(err, result) {
                if (err) return cb(err);
                compilationResult = _.extend(result, compilationResult);
                cb();
            });
        },
        function(cb) {
            singleChoiceAbi = JSON.parse(compilationResult.SingleChoice.interface);
            ethConnector.deploy(compilationResult.SingleChoice.interface,
                compilationResult.SingleChoice.bytecode,
                0,
                0,
                organization.address,
                rlpDefinition,
                function(err, _singleChoice) {
                    if (err) return cb(err);
                    singleChoice = _singleChoice;
                    cb();
                });
        },
        function(cb) {
            organization.owner(function(err, res) {
                if (err) return cb(err);
                owner = res;
                cb();
            });
        },
        function(cb) {
            organization.addPoll(
                definition.question,
                definition.closeDelegateTime,
                definition.closeTime,
                definition.categoryId,
                singleChoice.address,
                {
                    from: owner,
                    gas: 2000000
                },
                function(err, txHash) {
                    if (err) return cb(err);


                    ethConnector.web3.eth.getTransactionReceipt(txHash, function(err, res) {
                        // log 0 -> PollAdded
                        //      topic 0 -> Event Name
                        //      topic 1 -> idSubmission
                        idPoll = res.logs[0].topics[1];
                        cb();
                    });
                }
            );
        }
    ], function(err) {
        if (err) return cb(err);
        cb(null,singleChoice, idPoll);
    });

}


